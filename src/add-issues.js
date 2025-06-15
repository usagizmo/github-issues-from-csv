import fs from 'fs';
import csvParser from 'csv-parser';
import readline from 'readline';
import { spawnSync } from 'child_process';

// Check if GitHub CLI is installed
function checkGitHubCLI() {
  const result = spawnSync('gh', ['--version'], { stdio: 'pipe' });
  if (result.status !== 0) {
    console.error(c.red('GitHub CLI (gh) is not installed. Please install it first.'));
    console.error(c.yellow('Visit: https://cli.github.com/'));
    process.exit(1);
  }
}

// Check if GitHub CLI is authenticated
function checkGitHubAuth() {
  const result = spawnSync('gh', ['auth', 'status'], { stdio: 'pipe' });
  if (result.status !== 0) {
    console.error(c.red('GitHub CLI authentication failed. Please run "gh auth login" first.'));
    process.exit(1);
  }
}

// Parse repository string in format owner/repo
function parseRepository(repoString) {
  const match = repoString.match(/^([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error('Repository must be in format "owner/repo"');
  }
  return { owner: match[1], repo: match[2] };
}

// Check if repository exists
function checkRepository(repoString) {
  const result = spawnSync('gh', ['repo', 'view', repoString], { stdio: 'pipe' });
  if (result.status !== 0) {
    console.error(c.red(`Repository ${repoString} not found or not accessible.`));
    process.exit(1);
  }
}

const c = {
  red: (str) => `\x1b[31m${str}\x1b[0m`,
  green: (str) => `\x1b[32m${str}\x1b[0m`,
  yellow: (str) => `\x1b[33m${str}\x1b[0m`,
};

(async () => {
  try {
    // Check if GitHub CLI is installed
    checkGitHubCLI();
    checkGitHubAuth();

    const { repoString, csvFilePath } = await askQuestions();
    const { owner, repo } = parseRepository(repoString);

    // Check if repository exists
    checkRepository(repoString);

    const issues = await readCSV(csvFilePath);
    console.log(c.green(`Found ${issues.length} issues to create`));

    await createIssues(issues, repo, owner);
    console.log(c.green('All issues have been created'));
  } catch (error) {
    console.error(c.red(`Error: ${error.message}`));
    process.exit(1);
  }
})();

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const issueList = [];

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Check if required fields are present
        if (!row.title || !row.title.trim()) {
          console.warn(c.yellow(`Warning: Skipping row with empty title: ${JSON.stringify(row)}`));
          return;
        }

        issueList.push({
          title: row.title.trim(),
          body: row.body || '',
          assignees: row.assignees || '',
        });
      })
      .on('end', () => {
        if (issueList.length === 0) {
          reject(new Error('No valid issues found in CSV file'));
          return;
        }
        resolve(issueList);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function createIssues(issues, repo, owner) {
  for (const issue of issues) {
    try {
      // Create issue using gh api command with spawnSync to avoid shell escaping issues
      const args = [
        'api',
        `repos/${owner}/${repo}/issues`,
        '--method',
        'POST',
        '--field',
        `title=${issue.title}`,
      ];

      if (issue.body && issue.body.trim()) {
        args.push('--field', `body=${issue.body}`);
      }

      if (issue.assignees && issue.assignees.trim()) {
        const assigneeList = issue.assignees
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a);
        assigneeList.forEach((assignee) => {
          args.push('--field', `assignees[]=${assignee}`);
        });
      }

      const result = spawnSync('gh', args, { stdio: 'pipe' });

      if (result.status !== 0) {
        throw new Error(`gh command failed: ${result.stderr.toString()}`);
      }

      console.log(c.yellow('Issue created: ') + issue.title);
    } catch (error) {
      console.error(c.red(`Error creating issue: ${issue.title} - ${error.message}`));
    }
  }
}

async function askQuestions() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => {
    return new Promise((resolve) => {
      rl.question(c.yellow(query), (answer) => {
        resolve(answer);
      });
    });
  };

  const repoString = await question('Enter the GitHub repository (owner/repo): ');
  const csvSelection = await question('\n1: sample-1.csv\n2: sample-2.csv\nChoose the CSV file: ');

  let csvFilePath = '';

  switch (csvSelection.toLowerCase()) {
    case '1':
      csvFilePath = './src/data/sample-1.csv';
      break;
    case '2':
      csvFilePath = './src/data/sample-2.csv';
      break;
    default:
      console.error(c.red('Invalid selection. Please choose.'));
      process.exit(1);
  }

  rl.close();

  return { repoString, csvFilePath };
}

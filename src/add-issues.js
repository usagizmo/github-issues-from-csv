import fs from 'fs';
import csvParser from 'csv-parser';
import readline from 'readline';
import { execSync } from 'child_process';

// Check if GitHub CLI is installed
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
  } catch (error) {
    console.error(c.red('GitHub CLI (gh) is not installed. Please install it first.'));
    console.error(c.yellow('Visit: https://cli.github.com/'));
    process.exit(1);
  }
}

// Check if GitHub CLI is authenticated
function checkGitHubAuth() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
  } catch (error) {
    console.error(c.red('GitHub CLI authentication failed. Please run "gh auth login" first.'));
    process.exit(1);
  }
}

// Get owner information
function getOwner() {
  try {
    const userInfo = JSON.parse(execSync('gh api user', { encoding: 'utf8' }));
    return userInfo.login;
  } catch (error) {
    console.error(c.red('Failed to get user information from GitHub.'));
    process.exit(1);
  }
}

// Check if repository exists
function checkRepository(owner, repo) {
  try {
    execSync(`gh repo view ${owner}/${repo}`, { stdio: 'pipe' });
  } catch (error) {
    console.error(c.red(`Repository ${owner}/${repo} not found or not accessible.`));
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

    const owner = getOwner();
    const { repo, csvFilePath } = await askQuestions();

    // Check if repository exists
    checkRepository(owner, repo);

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
      // Create issue using gh api command
      const fields = [`--field`, `title=${issue.title}`];

      if (issue.body && issue.body.trim()) {
        fields.push(`--field`, `body=${issue.body}`);
      }

      if (issue.assignees && issue.assignees.trim()) {
        const assigneeList = issue.assignees
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a);
        if (assigneeList.length > 0) {
          fields.push(`--field`, `assignees=${JSON.stringify(assigneeList)}`);
        }
      }

      const cmd = ['gh', 'api', `repos/${owner}/${repo}/issues`, '--method', 'POST', ...fields];
      execSync(cmd.join(' '), { stdio: 'pipe' });
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

  const repo = await question('Enter the GitHub repository name: ');
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

  return { repo, csvFilePath };
}

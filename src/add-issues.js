import fs from 'fs';
import csvParser from 'csv-parser';
import readline from 'readline';
import { Octokit } from 'octokit';

const TOKEN = process.env.TOKEN;
const OWNER = process.env.OWNER;

const c = {
  red: (str) => `\x1b[31m${str}\x1b[0m`,
  green: (str) => `\x1b[32m${str}\x1b[0m`,
  yellow: (str) => `\x1b[33m${str}\x1b[0m`,
};

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const issueList = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        issueList.push({ title: row.title, body: row.body, assignees: row.assignees });
      })
      .on('end', () => {
        resolve(issueList);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const createIssues = async (issues, octokit, repo) => {
  for (const issue of issues) {
    try {
      await octokit.rest.issues.create({
        owner: OWNER,
        repo,
        title: issue.title,
        body: issue.body,
        assignees: issue.assignees.split(',').map((assignee) => assignee.trim()),
      });
      console.log(c.yellow('Issue created: ') + issue.title);
    } catch (error) {
      console.error(c.red(`Error creating issue: ${issue.title} - ${error.message}`));
    }
  }
};

const askQuestions = async () => {
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
};

(async () => {
  const { repo, csvFilePath } = await askQuestions();
  const issues = await readCSV(csvFilePath);
  const octokit = new Octokit({ auth: TOKEN });

  await createIssues(issues, octokit, repo);
  console.log(c.green('All issues have been created'));
})();

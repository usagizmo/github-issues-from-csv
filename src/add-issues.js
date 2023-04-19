import fs from 'fs';
import csvParser from 'csv-parser';
import readline from 'readline';
import { Octokit } from 'octokit';

const TOKEN = process.env.TOKEN;
const OWNER = process.env.OWNER;

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
      console.log(`Issue created: ${issue.title}`);
    } catch (error) {
      console.error(`Error creating issue: ${issue.title} - ${error.message}`);
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
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  };

  const repo = await question('Enter the GitHub repository name: ');
  const csvSelection = await question('\n0: sample-1.csv\n1: sample-2.csv\nChoose the CSV file: ');

  let csvFilePath = '';

  switch (csvSelection.toLowerCase()) {
    case '0':
      csvFilePath = './src/data/sample-1.csv';
      break;
    case '1':
      csvFilePath = './src/data/sample-2.csv';
      break;
    default:
      console.error('Invalid selection. Please choose 0 or 1.');
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
  console.log('All issues have been created');
})();

# GitHub issues from CSV

This is a Node.js script that allows you to add issues to a GitHub repository from a CSV file. It uses the csv-parser library to read the CSV file and the octokit library to interact with the GitHub API.

https://user-images.githubusercontent.com/1271863/233315221-49b682f2-a212-4bf0-b85e-8cd303bff24b.mp4

## Prerequisites

Before running the script, you need to have:

- A GitHub account
- A personal access token with the `repo` scope. You can generate a personal access token at https://github.com/settings/personal-access-tokens. Make sure to grant the token `Read and write` permissions for `Issues`.
- Node.js installed on your machine

## Installation

1. Clone this repository to your local machine
2. Navigate to the cloned directory and run `npm install` to install the dependencies
3. Create a `.env` file from `.env.example` and set the following environment variables:

```.env
TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
OWNER=GITHUB_REPO_OWNER
```

## Usage

To use the script:

1. Run `npm run add-issues` from the command line
2. Enter the name of the repository you want to add issues to
3. Choose the CSV file you want to use (either `sample-1.csv` or `sample-2.csv`)
4. The script will create issues in the repository based on the data in the CSV file

## License

This project is licensed under the MIT License.

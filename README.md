# GitHub issues from CSV

This is a Node.js script that allows you to add issues to a GitHub repository from a CSV file. It uses the csv-parser library to read the CSV file and the GitHub CLI to interact with the GitHub API.

https://user-images.githubusercontent.com/1271863/233315221-49b682f2-a212-4bf0-b85e-8cd303bff24b.mp4

## Prerequisites

Before running the script, you need to have:

- A GitHub account
- [GitHub CLI](https://cli.github.com/) installed and authenticated
- Node.js installed on your machine

## Installation

1. Clone this repository to your local machine
2. Navigate to the cloned directory and run `pnpm install` to install the dependencies
3. Authenticate with GitHub CLI by running `gh auth login` and follow the prompts

## Usage

To use the script:

1. Run `pnpm run add-issues` from the command line
2. Enter the repository in the format `owner/repo` (e.g., `usagizmo/github-issues-from-csv`)
3. Choose the CSV file you want to use (either `sample-1.csv` or `sample-2.csv`)
4. The script will create issues in the repository based on the data in the CSV file

## Features

- **No .env file required**: Uses GitHub CLI authentication
- **Automatic validation**: Checks GitHub CLI installation and authentication status
- **Repository verification**: Confirms repository exists and is accessible
- **CSV validation**: Validates CSV format and required fields
- **Error handling**: Comprehensive error handling with clear messages
- **Progress tracking**: Shows progress during issue creation

## License

This project is licensed under the MIT License.

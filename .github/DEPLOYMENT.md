# GitHub Actions Deployment Setup

This repository includes an automated deployment workflow that builds your Hugo site and deploys it to an FTP server.

## Required GitHub Secrets

To enable the deployment workflow, you need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

### Secrets to Configure:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `FTP_SERVER` | Your FTP server hostname | `ftp.yourhost.com` |
| `FTP_USERNAME` | Your FTP username | `your-username` |
| `FTP_PASSWORD` | Your FTP password | `your-secure-password` |

## How the Deployment Works

1. **Trigger**: The workflow runs automatically on every push to the `main` branch, or can be triggered manually
2. **Build**: Hugo builds your static site with minification
3. **Backup**: The existing `aymenfurter.ch` directory on the FTP server is renamed to `aymenfurter.ch_YYYYMMDD_HHMMSS` (e.g., `aymenfurter.ch_20251016_143022`)
4. **Deploy**: The new site is uploaded to a fresh `aymenfurter.ch` directory

## Manual Deployment

You can manually trigger a deployment:
1. Go to **Actions** tab in your GitHub repository
2. Select **Build and Deploy to FTP** workflow
3. Click **Run workflow** → **Run workflow**

## Notes

- The workflow uses FTPS (FTP over SSL) for secure transfer
- Old backups are kept on the server (you may want to clean them up periodically)
- The deployment preserves the ability to rollback by keeping timestamped backups

## Troubleshooting

If deployment fails:
- Verify all secrets are correctly set
- Check that your FTP server supports FTPS
- Review the Actions logs for specific error messages
- Ensure your FTP user has write permissions on the server

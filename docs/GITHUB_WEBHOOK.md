# GitHub Webhook Setup

This project will use GitHub Actions deployment or workflow events to create deployment health snapshots.

For local testing:

1. Start the server on port `5000`.
2. Expose it with ngrok.
3. Add the ngrok URL as a GitHub webhook endpoint:

```txt
https://your-ngrok-url.ngrok-free.app/webhooks/github
```

4. Set the webhook secret to match `GITHUB_WEBHOOK_SECRET`.

Mock mode can be used before connecting a real repository.

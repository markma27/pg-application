import { RateLimiterMemory } from "rate-limiter-flexible";

const applicationSubmitLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
});

const portfolioUploadLimiter = new RateLimiterMemory({
  points: 40,
  duration: 60,
});

export async function consumeApplicationSubmitRateLimit(clientKey: string): Promise<void> {
  await applicationSubmitLimiter.consume(clientKey);
}

export async function consumePortfolioUploadRateLimit(clientKey: string): Promise<void> {
  await portfolioUploadLimiter.consume(clientKey);
}

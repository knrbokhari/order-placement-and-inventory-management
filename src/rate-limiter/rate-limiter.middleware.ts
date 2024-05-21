import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  lastRequest: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly requests: Record<string, RateLimitInfo> = {};
  private readonly rateLimit = 10; // max requests
  private readonly rateLimitWindow = 60000; // time window in milliseconds (1 minute)

  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['api-key'] as string;

    if (!apiKey) {
      throw new HttpException('API key is missing', HttpStatus.BAD_REQUEST);
    }

    const currentTime = Date.now();
    const rateLimitInfo = this.requests[apiKey] || {
      count: 0,
      lastRequest: currentTime,
    };

    if (currentTime - rateLimitInfo.lastRequest > this.rateLimitWindow) {
      rateLimitInfo.count = 1;
      rateLimitInfo.lastRequest = currentTime;
    } else {
      rateLimitInfo.count += 1;
    }

    this.requests[apiKey] = rateLimitInfo;

    if (rateLimitInfo.count > this.rateLimit) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}

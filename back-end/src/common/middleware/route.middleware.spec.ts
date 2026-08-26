import { RouteMiddleware } from './route.middleware';
import { ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('RouteMiddleware', () => {
  let middleware: RouteMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new RouteMiddleware();
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('Public Route Interception', () => {
    it('should call next() and attach routeContext for /auth/login without x-role', () => {
      mockRequest = {
        originalUrl: '/auth/login',
        method: 'POST',
        headers: {},
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.routeContext).toBeDefined();
      expect(mockRequest.routeContext?.isPublic).toBe(true);
      expect(mockRequest.routeContext?.role).toBe('PUBLIC');
      expect(mockRequest.routeContext?.route).toBe('/auth/login');
      expect(mockRequest.routeContext?.method).toBe('POST');
    });

    it('should call next() and attach routeContext for /api (Swagger docs)', () => {
      mockRequest = {
        originalUrl: '/api',
        method: 'GET',
        headers: {},
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.routeContext?.isPublic).toBe(true);
      expect(mockRequest.routeContext?.role).toBe('PUBLIC');
    });

    it('should call next() and attach routeContext for root route /', () => {
      mockRequest = {
        originalUrl: '/',
        method: 'GET',
        headers: {},
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.routeContext?.isPublic).toBe(true);
    });
  });

  describe('Protected Route Interception', () => {
    it('should throw 403 ForbiddenException when x-role header is missing on /courses', () => {
      mockRequest = {
        originalUrl: '/courses',
        method: 'GET',
        headers: {},
      };

      expect(() => {
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );
      }).toThrow(ForbiddenException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should throw 403 ForbiddenException when x-role header is missing on /registrations', () => {
      mockRequest = {
        originalUrl: '/registrations',
        method: 'POST',
        headers: {},
      };

      expect(() => {
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );
      }).toThrow(ForbiddenException);

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() and attach routeContext when x-role header is provided on protected route', () => {
      mockRequest = {
        originalUrl: '/courses',
        method: 'GET',
        headers: {
          'x-role': 'Student',
        },
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.routeContext).toBeDefined();
      expect(mockRequest.routeContext?.isPublic).toBe(false);
      expect(mockRequest.routeContext?.role).toBe('Student');
      expect(mockRequest.routeContext?.route).toBe('/courses');
      expect(mockRequest.routeContext?.method).toBe('GET');
      expect(mockRequest.routeContext?.timestamp).toBeDefined();
    });
  });
});

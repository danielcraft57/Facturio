import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { Response, Request } from 'express';

describe('HttpExceptionFilter', () => {
	let filter: HttpExceptionFilter;
	let mockResponse: Partial<Response>;
	let mockRequest: Partial<Request>;
	let mockArgumentsHost: ArgumentsHost;

	beforeEach(() => {
		filter = new HttpExceptionFilter();
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		mockRequest = {
			url: '/api/test',
			method: 'GET'
		};
		mockArgumentsHost = {
			switchToHttp: jest.fn().mockReturnValue({
				getResponse: () => mockResponse,
				getRequest: () => mockRequest
			})
		} as unknown as ArgumentsHost;
	});

	it('devrait transformer une HttpException en réponse standardisée', () => {
		const exception = new BadRequestException('Test error');
		
		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			statusCode: 400,
			message: 'Test error',
			timestamp: expect.any(String),
			path: '/api/test'
		});
	});

	it('devrait gérer les erreurs de validation avec messages multiples', () => {
		const exception = new BadRequestException({
			message: ['Field 1 is required', 'Field 2 must be an email'],
			error: 'Bad Request'
		});
		
		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			statusCode: 400,
			message: 'Validation failed',
			errors: ['Field 1 is required', 'Field 2 must be an email'],
			timestamp: expect.any(String),
			path: '/api/test'
		});
	});

	it('devrait gérer les erreurs non gérées (500)', () => {
		const exception = new Error('Unexpected error');
		
		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(500);
		expect(mockResponse.json).toHaveBeenCalledWith({
			statusCode: 500,
			message: 'Internal server error',
			timestamp: expect.any(String),
			path: '/api/test'
		});
	});

	it('devrait gérer NotFoundException correctement', () => {
		const exception = new NotFoundException('Resource not found');
		
		filter.catch(exception, mockArgumentsHost);

		expect(mockResponse.status).toHaveBeenCalledWith(404);
		expect(mockResponse.json).toHaveBeenCalledWith({
			statusCode: 404,
			message: 'Resource not found',
			timestamp: expect.any(String),
			path: '/api/test'
		});
	});

	it('devrait inclure le timestamp et le path dans la réponse', () => {
		const exception = new BadRequestException('Test');
		
		filter.catch(exception, mockArgumentsHost);

		const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
		expect(callArgs).toHaveProperty('timestamp');
		expect(callArgs).toHaveProperty('path', '/api/test');
		expect(new Date(callArgs.timestamp)).toBeInstanceOf(Date);
	});
});


import { apiClient, type ApiResponse } from './api';

export interface Payment {
	id: number;
	invoiceId: number;
	amount: number;
	date: string;
	method?: string;
	notes?: string;
	createdAt: string;
	invoice?: {
		id: number;
		number: string;
		client?: {
			id: number;
			name: string;
		};
	};
}

export interface CreatePaymentDto {
	invoiceId: number;
	amount: number;
	date?: string | Date;
	method?: string;
	notes?: string;
}

export interface UpdatePaymentDto {
	amount?: number;
	date?: string | Date;
	method?: string;
	notes?: string;
}

export class PaymentsService {
	private baseUrl = '/payments';

	async getPayments(invoiceId?: number): Promise<ApiResponse<Payment[]>> {
		const url = invoiceId ? `${this.baseUrl}?invoiceId=${invoiceId}` : this.baseUrl;
		return apiClient.get<Payment[]>(url);
	}

	async getPayment(id: number): Promise<ApiResponse<Payment>> {
		return apiClient.get<Payment>(`${this.baseUrl}/${id}`);
	}

	async createPayment(data: CreatePaymentDto): Promise<ApiResponse<Payment>> {
		const response = await apiClient.post<Payment>(this.baseUrl, data);
		// Invalider le cache des factures
		apiClient.invalidateCache(`/invoices/${data.invoiceId}`);
		apiClient.invalidateCache('/invoices');
		return response;
	}

	async updatePayment(id: number, data: UpdatePaymentDto): Promise<ApiResponse<Payment>> {
		const payment = await this.getPayment(id);
		const response = await apiClient.patch<Payment>(`${this.baseUrl}/${id}`, data);
		// Invalider le cache des factures
		if (payment.data?.invoiceId) {
			apiClient.invalidateCache(`/invoices/${payment.data.invoiceId}`);
			apiClient.invalidateCache('/invoices');
		}
		return response;
	}

	async deletePayment(id: number): Promise<ApiResponse<void>> {
		const payment = await this.getPayment(id);
		await apiClient.delete(`${this.baseUrl}/${id}`);
		// Invalider le cache des factures
		if (payment.data?.invoiceId) {
			apiClient.invalidateCache(`/invoices/${payment.data.invoiceId}`);
			apiClient.invalidateCache('/invoices');
		}
		return { data: undefined, success: true };
	}
}

export const paymentsService = new PaymentsService();





import { IsNumber, Min } from 'class-validator';
import { SendDocumentEmailDto } from '../../common/dto/send-document-email.dto';

export class SendPayableDebtPaymentNoticeDto extends SendDocumentEmailDto {
	@IsNumber()
	@Min(0.01)
	paymentAmount!: number;
}

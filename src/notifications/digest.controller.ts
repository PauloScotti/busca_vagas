import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DigestService } from './digest.service';

@ApiTags('digest')
@Controller('digest')
export class DigestController {
  constructor(private readonly digestService: DigestService) {}

  @Post('send')
  @HttpCode(202)
  @ApiOperation({ summary: 'Envia manualmente o digest de matches novos para o Telegram' })
  send() {
    return this.digestService.sendDaily();
  }
}

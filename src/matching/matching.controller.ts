import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { ListMatchesQueryDto } from './matching.dto';

@ApiTags('matches')
@Controller('matches')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('run')
  @HttpCode(202)
  @ApiOperation({ summary: 'Roda o matching: pré-filtro local + scoring via LLM das vagas ainda não avaliadas' })
  run() {
    return this.matchingService.run();
  }

  @Get()
  @ApiOperation({ summary: 'Lista matches ordenados por score, com a vaga incluída' })
  list(@Query() query: ListMatchesQueryDto) {
    return this.matchingService.list(query);
  }
}

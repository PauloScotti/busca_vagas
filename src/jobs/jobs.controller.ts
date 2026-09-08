import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { CollectBodyDto, ListJobsQueryDto } from './jobs.dto';
import { Env } from '../config/env';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista vagas coletadas com filtros e paginação' })
  list(@Query() query: ListJobsQueryDto) {
    return this.jobsService.list(query);
  }

  @Post('collect')
  @HttpCode(202)
  @ApiOperation({ summary: 'Dispara coleta manual em todas as fontes' })
  collect(@Body() body: CollectBodyDto) {
    const terms = body.searchTerms ?? this.config.getOrThrow('SEARCH_TERMS', { infer: true });
    return this.jobsService.collectAll(terms);
  }
}

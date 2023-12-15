import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RosterService } from './roster.service';

@ApiTags('roster')
@Controller('roster')
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @ApiOperation({ summary: 'Get roster of users' })
  @ApiResponse({ status: 200, description: 'Return roster of users.' })
  @Get()
  async getRoster(): Promise<any[]> {
    return this.rosterService.getRosterStats();
  }
}


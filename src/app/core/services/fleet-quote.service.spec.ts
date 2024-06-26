import { TestBed } from '@angular/core/testing';

import { FleetQuoteService } from './fleet-quote.service';

describe('FleetQuoteService', () => {
  let service: FleetQuoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FleetQuoteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

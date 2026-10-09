import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '../../libs/dto/event/event';

@Injectable()
export class EventService {
    constructor(
        @InjectModel('Event')
        private readonly eventModel: Model<Event>,
    ) { }
}

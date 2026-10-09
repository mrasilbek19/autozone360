import { Module } from '@nestjs/common';
import { ViewService } from './view.service';
import ViewSchema from '../../schemas/View.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'View', schema: ViewSchema }])],
  providers: [ViewService],
  exports: [ViewService],
})
export class ViewModule { }

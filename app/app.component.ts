import { Component, Input } from '@angular/core';


@Component({
  moduleId: module.id,
  selector: 'my-app',
  templateUrl: 'app.component.html',
  styleUrls: [ 'app.component.css' ],
  providers: []
})
export class AppComponent {

  hello = '';

  constructor(
  ){}

  ngOnInit(): void {
    this.hello = 'Sarlacc JS Client';
  }


}
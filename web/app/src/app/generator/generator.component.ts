import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { concatMap, Subject, } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneratorService } from './generator.service';
import { ZoomService } from '../map/zoom.service';
import { GeneratorResponse } from './generator-response';
import { EntitiesContainerService } from '../map/entities-container.service';

export class GeneratorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

/*
  TODO: test in docker-compose
*/

@Component({
  selector: 'app-generator',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.css']
})
export class GeneratorComponent implements OnInit {

  matcher = new GeneratorStateMatcher();

  sendQueryDuration = new Subject<string>()
  sendResultArivalDuration = new Subject<string>()
  clearQueryDuration = new Subject<string>()
  clearResultArrivalDuration = new Subject<string>()

  randomGenerator = new FormGroup({
    numGenerated: new FormControl(0, [Validators.pattern(new RegExp("^[1-9][0-9]*$"))]),
    rate: new FormControl(0, [Validators.pattern(new RegExp("^[1-9][0-9]*$"))]),
  })

  entitySender = new FormGroup({
    numSent: new FormControl(0, [Validators.pattern(new RegExp("^[1-9][0-9]*$"))]),
  })

  constructor(private generatorService: GeneratorService,
    private zoomService: ZoomService,
    private entitiesContainerService: EntitiesContainerService,
    public dialog: MatDialog) { }

  ngOnInit(): void { }

  generateRandom(): void {
    const numGenerated = Number(this.randomGenerator.controls.numGenerated.value)
    const rate = Number(this.randomGenerator.controls.rate.value)
    if (numGenerated === null || rate === null) {
      throw Error("random values aren't initialised")
    }

    this.generatorService.sendSetEntitiesRequest(numGenerated)
      .pipe(
        concatMap(_ => this.generatorService.sendSetRateRequest(rate)),
        concatMap(_ => this.generatorService.sendStartRandomRequest())
      )
      .subscribe({
        error: (errResponse) => this.handleErrorResponse(errResponse)
      }
      )
  }

  stopGenerating(): void {
    this.generatorService.sendStopRandomRequest()
      .subscribe({
        error: (errResponse) => this.handleErrorResponse(errResponse)
      }
      )
  }

  sendEntities(): void {
    if (this.entitySender.controls.numSent.value === null) {
      throw Error("entity values aren't initialised")
    }

    this.clearSendSubjects()    

    const  startTime = new Date();
    this.entitiesContainerService.waitForValue(Number(this.entitySender.controls.numSent.value)).subscribe(
      () => {
        const endTime = new Date();
        this.sendResultArivalDuration.next(`Data arrival took ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(5)} seconds`)
      }
    )

    this.generatorService.sendSendNEntitiesRequest(this.entitySender.controls.numSent.value, this.zoomService.currentZoom)
      .subscribe({
        next: (response) => this.sendQueryDuration.next(`The insert query took ${((response as GeneratorResponse).queryduration / 1000000000).toFixed(5)} seconds`),
        error: (errResponse) => this.handleErrorResponse(errResponse)
      }
      )
  }

  clearAll(): void {
    this.clearClearAllSubjects()
    const  startTime = new Date();
    this.entitiesContainerService.waitForValue(0).subscribe(
      () => {
        const endTime = new Date();
        this.clearResultArrivalDuration.next(`Data arrival took ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(5)} seconds`)
      }
    )
    
    this.generatorService.sendClearAllEntitiesRequest()
      .subscribe({
        next: (response) => this.clearQueryDuration.next(`The clear query took ${((response as GeneratorResponse).queryduration / 1000000000).toFixed(5)} seconds`),
        error: (errResponse) => this.handleErrorResponse(errResponse)
      }
      )
  }

  private handleErrorResponse(errResponse: { error: GeneratorResponse; }) {
    this.dialog.open(ErrorDialog, {
      data: new ErrorData(errResponse.error.message),
    });
  }

  private clearSendSubjects() {
    this.sendResultArivalDuration.next('')
    this.sendQueryDuration.next('')
  }

  private clearClearAllSubjects() {
    this.clearResultArrivalDuration.next('')
    this.clearQueryDuration.next('')
  }

}

export class ErrorData {
  message: string

  constructor(message: string) {
    this.message = message
  }
}

@Component({
  selector: 'app-error-popup',
  templateUrl: './error-popup.html',
})
export class ErrorDialog {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialog>,
    @Inject(MAT_DIALOG_DATA) public error: ErrorData,
  ) { }
}

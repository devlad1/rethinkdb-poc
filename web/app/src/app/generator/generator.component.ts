import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { concatMap, } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneratorService } from './generator.service';
import { ZoomService } from '../map/zoom.service';

export class GeneratorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

/*
  TODO: add timers and metrics
  TODO: test in docker-compose
*/

@Component({
  selector: 'app-generator',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.css']
})
export class GeneratorComponent implements OnInit {

  matcher = new GeneratorStateMatcher();

  randomGenerator = new FormGroup({
    numGenerated: new FormControl(0, [Validators.pattern(new RegExp("^[1-9][0-9]*$"))]),
    rate: new FormControl(0, [Validators.pattern(new RegExp("^[1-9][0-9]*$"))]),
  })

  entitySender = new FormGroup({
    numSent: new FormControl(0, [Validators.pattern(new RegExp("^[1-9][0-9]*$"))]),
  })

  constructor(private generatorService: GeneratorService,
    private zoomService: ZoomService,
    public dialog: MatDialog) { }

  ngOnInit(): void { }

  generateRandom(): void {
    this.generatorService.sendSetEntitiesRequest(this.randomGenerator.controls.numGenerated.value)
      .pipe(
        concatMap(_ => this.generatorService.sendSetRateRequest(this.randomGenerator.controls.rate.value)),
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
    this.generatorService.sendSendNEntitiesRequest(this.entitySender.controls.numSent.value, this.zoomService.currentZoom)
      .subscribe({
        error: (errResponse) => this.handleErrorResponse(errResponse)
      }
      )
  }

  clearAll(): void {
    this.generatorService.sendClearAllEntitiesRequest()
      .subscribe({
        error: (errResponse) => this.handleErrorResponse(errResponse)
      }
      )
  }

  private handleErrorResponse(errResponse: { error: { message: string; }; }) {
    this.dialog.open(ErrorDialog, {
      data: new ErrorData(errResponse.error.message),
    });
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

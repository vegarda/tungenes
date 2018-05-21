
import { Request, Response } from 'express';

import { ValidParams } from 'types';

export function validateParams(req: Request, res: Response): ValidParams {

    console.log('validateParams');

    let params: ValidParams = {
        timeUnit: 'day',
        amount: 1
    };

    let allowedTimeUnits: string[] = ['yesterday', 'day', 'week', 'month', 'year', 'ytd'];

    try {
        params.amount = Number(req.params.amount);
        params.timeUnit = req.params.timeUnit.toLowerCase();
    }
    catch (err) {
        res.sendStatus(400);
        return null;
    }

    if (allowedTimeUnits.indexOf(params.timeUnit) < 0) {
        res.sendStatus(400);
        return null;
    }

    if (params.amount < 1) {
        params.amount = 1;
    }

    console.log(params);

    return params;

}
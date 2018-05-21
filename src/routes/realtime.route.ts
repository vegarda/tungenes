
import { Router, Request, Response } from 'express';

import connection from './../database';

const router = Router();

router.get('/realtime', (req: Request, res: Response) => {
    connection.query('SELECT * from raw order by dateTime desc limit 1', (err, rows, fields) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        }
        if (rows && rows[0]) {
            res.status(200).send(rows[0]);
        }
        else {
            res.sendStatus(204);
        }
    });
});


export default router;
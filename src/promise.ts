import { BehaviorSubject, Subject, merge, Observable } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

export interface IBetterPromise<T = void> {
    onReject$: Observable<any>;
    onResolve$: Observable<T>;
    onFulfilled$: Observable<any>;
    isRejected$: Observable<boolean>;
    isRejected: boolean;
    isResolved$: Observable<boolean>;
    isResolved: boolean;
    isFulfilled$: Observable<boolean>;
    isFulfilled: boolean;
    value: T;
}

export class BetterPromise<T = void> extends Promise<T> implements IBetterPromise<T> {

    private _onReject$: Subject<any>;
    public get onReject$(): Observable<any> {
        return this._onReject$;
    }

    private _onResolve$: Subject<T>;
    public get onResolve$(): Observable<T> {
        return this._onResolve$;
    }

    private _onFulfilled$: Observable<any>;
    public get onFulfilled$(): Observable<any> {
        return this._onFulfilled$;
    }

    private _isRejected$: BehaviorSubject<boolean>;
    public get isRejected$(): Observable<boolean> {
        return this._isRejected$;
    }
    public get isRejected(): boolean {
        return this._isRejected$.value;
    }

    private _isResolved$: BehaviorSubject<boolean>;
    public get isResolved$(): Observable<boolean> {
        return this._isResolved$;
    }
    public get isResolved(): boolean {
        return this._isResolved$.value;
    }

    private _isFulfilled$: BehaviorSubject<boolean>;
    public get isFulfilled$(): Observable<boolean> {
        return this._isFulfilled$;
    }
    public get isFulfilled(): boolean {
        return this._isFulfilled$.value;
    }

    private _value: T;
    public get value(): T {
        return this._value;
    }

    constructor(
        executor?: (
            resolve: (value: T) => void,
            reject?: (reason?: any) => void
        ) => void
    ) {

        let _resolver: (value?: T) => void;
        let _rejecter: (value?: T) => void;

        super((resolver, rejecter) => {
            _resolver = resolver;
            _rejecter = rejecter;
        });

        this._onResolve$ = new Subject();
        this._onReject$ = new Subject();
        this._onFulfilled$ = merge(this._onResolve$, this._onReject$);

        this._isRejected$ = new BehaviorSubject(false);
        this._isResolved$ = new BehaviorSubject(false);
        this._isFulfilled$ = merge(this._isResolved$, this._isResolved$) as BehaviorSubject<boolean>;

        this._onResolve$.pipe(first(), takeUntil(this._onReject$)).subscribe((value?: T) => {
            this._value = value;
            _resolver(value);
            this._isResolved$.next(true);
        });

        this._onReject$.pipe(first(), takeUntil(this._onResolve$)).subscribe((value?: any) => {
            _rejecter(value);
            this._isRejected$.next(true);
        });

        if (executor) {
            executor(
                value => {
                    this.resolve(value);
                },
                reason => {
                    this.reject(reason);
                }
            );
        }

    }

    public resolve(value?: T): void {
        if (this.isFulfilled) {
            return;
        }
        // console.log('resolveresolveresolveresolveresolve');
        this._onResolve$.next(value);
        this._onResolve$.complete();
        this._onReject$.complete();
    }

    public reject(reason?: any): void {
        if (this.isFulfilled) {
            return;
        }
        // console.log('rejectrejectrejectrejectrejectreject', reason);
        this._onReject$.next(reason);
        this._onReject$.complete();
        this._onResolve$.complete();
    }

}


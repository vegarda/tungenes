import { BehaviorSubject, Subject, Observable } from 'rxjs';


export class BetterPromise<T = void> extends Promise<T> {

    protected _onReject$: Subject<any>;
    public get onReject$(): Observable<any> {
        return this._onReject$;
    }

    protected _onResolve$: Subject<T>;
    public get onResolve$(): Observable<T> {
        return this._onResolve$;
    }

    protected _onFulfilled$: Subject<void>;
    public get onFulfilled$(): Observable<any> {
        return this._onFulfilled$;
    }

    protected _isRejected$: BehaviorSubject<boolean>;
    public get isRejected$(): Observable<boolean> {
        return this._isRejected$;
    }
    public get isRejected(): boolean {
        return this._isRejected$.value;
    }

    protected _isResolved$: BehaviorSubject<boolean>;
    public get isResolved$(): Observable<boolean> {
        return this._isResolved$;
    }
    public get isResolved(): boolean {
        return this._isResolved$.value;
    }

    protected _isFulfilled$: BehaviorSubject<boolean>;
    public get isFulfilled$(): Observable<boolean> {
        return this._isFulfilled$;
    }
    public get isFulfilled(): boolean {
        return this._isFulfilled$.value;
    }

    protected _value: T;
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
        this._onFulfilled$ = new Subject();

        this._isRejected$ = new BehaviorSubject(false);
        this._isResolved$ = new BehaviorSubject(false);
        this._isFulfilled$ = new BehaviorSubject(false);

        this._onFulfilled$.subscribe(() => {
            this._isFulfilled$.next(true);
            this._isFulfilled$.complete();
            this._isRejected$.complete();
            this._isResolved$.complete();
            this._onResolve$.complete();
            this._onReject$.complete();
        });

        this._onResolve$.subscribe((value?: T) => {
            this._value = value;
            _resolver(value);
            this._isResolved$.next(true);
            this._isResolved$.complete();
            this._onFulfilled$.next();
            this._onFulfilled$.complete();
        });

        this._onReject$.subscribe((value?: any) => {
            _rejecter(value);
            this._isRejected$.next(true);
            this._isRejected$.complete();
            this._onFulfilled$.next();
            this._onFulfilled$.complete();
        });

        if (executor) {
            executor(
                value => this.resolve(value),
                reason => this.reject(reason)
            );
        }

    }

    public resolve(value?: T): void {
        if (this.isFulfilled) {
            return;
        }
        this._onResolve$.next(value);
        this._onResolve$.complete();
    }

    public reject(reason?: any): void {
        if (this.isFulfilled) {
            return;
        }
        this._onReject$.next(reason);
        this._onReject$.complete();
    }

    public toPromise(): Promise<T> {
        return this;
    }

}


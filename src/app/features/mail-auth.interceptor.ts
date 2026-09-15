import {
  HttpInterceptorFn,
} from '@angular/common/http';


export const mailAuthInterceptor: HttpInterceptorFn =
  (req, next) => {

    console.log(
      '[Interceptor]',
      req.url,
    );


    const token =
      localStorage.getItem(
        'mail_token',
      );


    if (
      !token
      ||
      !req.url.includes('/api/mail')
    ) {
      return next(req);
    }


    return next(
      req.clone({
        setHeaders: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            'application/json',
        },
      }),
    );

  };

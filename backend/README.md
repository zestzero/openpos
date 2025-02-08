# Stock management API

## Database
[Create migration script](https://laravel.com/docs/11.x/migrations#creating-tables)
```bash
php artisan make:migration create_{tableName}_table
```

## Swagger document
- Powered by [L5 Swagger](https://github.com/DarkaOnLine/L5-Swagger) [Example](https://github.com/zircote/swagger-php/blob/master/Examples/petstore-3.0/Models/User.php)
- Access swagger via http://localhost/api/documentation
- Generate OpenAPI Spec

```bash
 php artisan l5-swagger:generate
```

### Powered by
<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

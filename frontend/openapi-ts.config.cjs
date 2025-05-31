/** @type {import('@hey-api/openapi-ts').UserConfig} */
module.exports = {
    input: 'http://localhost/docs?api-docs.json',
    output: 'src/client',
    plugins: ['@hey-api/client-fetch'],
};

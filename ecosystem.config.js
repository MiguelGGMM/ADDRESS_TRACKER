module.exports = {
    apps: [{
        name: 'ADDRESS_TRACKER',
        script: 'npm run start',
        time: true,
        log_file: 'log.log',
        log_date_format: "YYYY-MM-DD HH:mm",
        env: {
            NODE_ENV: 'production'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }]
};
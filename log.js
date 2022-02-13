const fs = require('fs');

module.exports = {
    info: function () {
        let date = new Date();
        const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
        const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
        let prefix = `[${day}-${month}-${year} ${hour}:${minutes}:${seconds}][INFO]: `;
        let args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        let log = prefix + args.join('\n')
        fs.appendFileSync('output.log', log + '\n');
    },
    err: function () {
        let date = new Date();
        const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
        const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
        let prefix = `[${day}-${month}-${year} ${hour}:${minutes}:${seconds}][ERROR]: `;
        let args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        let log = prefix + args.join('\n')
        fs.appendFileSync('error_log.log', log + '\n');
    }
}
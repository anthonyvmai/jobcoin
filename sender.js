const mysql = require('mysql')
const request = require('request')
const _ = require('lodash')
const Consumer = require('sqs-consumer')
const AWS = require('aws-sdk')

const sendUrl = 'https://sqs.us-east-1.amazonaws.com/976193603611/jobcoin-send'
const accessKeyId = 'AKIAI7UXIXCCNPCUJM3A'
const secretAccessKey = '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'
const region = 'us-east-1'

AWS.config.credentials = new AWS.Credentials(accessKeyId, secretAccessKey)
AWS.config.region = region

const pool = mysql.createPool({
	host: 'jobcoin-mysql.c7gn5ltapjua.us-east-1.rds.amazonaws.com',
	user: 'foouser',
	password: 'foobar123',
	database: 'jobcoin'
})

const houseAddress = 'house'

// truncate to 10 decimal places
function truncNum(num) {
	return Math.trunc(num * 10000000000) / 10000000000
}

function processMessage(msg) {
	const msgObj = JSON.parse(msg)
	const inAddress = msgObj.toAddress
	const amt = msgObj.amount
	pool.getConnection(function(err, conn) {
		if (err) {
			throw err
		}
		const sql = `SELECT outAddresses FROM mix_address where inAddress = "${inAddress}"`

		conn.query(sql, function(err, rows) {
			if (err) throw err
			const outAddresses = rows[0].outAddresses.split(',')
			const outAmt = truncNum(parseFloat(amt)/ outAddresses.length).toString()

			_.forEach(outAddresses, function(a) {
				const params = {fromAddress: houseAddress, toAddress: a, amount: outAmt}
				request.post({url: 'http://jobcoin.gemini.com/wrongness/api/transactions', form: params}, function(err) {
					if (err) throw err
					console.log(JSON.stringify(params))
				})
			})
		})
	})
}

const app = Consumer.create({
	queueUrl: sendUrl,
	handleMessage: (message, done) => {
		console.log('consuming from SQS')
		processMessage(message.Body)
		done();
	},
	sqs: new AWS.SQS()
});

app.on('error', (err) => {
	console.log(err.message);
});

app.start();

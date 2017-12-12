const request = require('request')
const Producer = require('sqs-producer')
const Consumer = require('sqs-consumer')
const AWS = require('aws-sdk')

const depositUrl = 'https://sqs.us-east-1.amazonaws.com/976193603611/jobcoin-deposit'
const sendUrl = 'https://sqs.us-east-1.amazonaws.com/976193603611/jobcoin-send'
const accessKeyId = 'AKIAI7UXIXCCNPCUJM3A'
const secretAccessKey = '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'
const region = 'us-east-1'

AWS.config.credentials = new AWS.Credentials(accessKeyId, secretAccessKey)
AWS.config.region = region

const producer = Producer.create({
	queueUrl: sendUrl,
	region: region,
	accessKeyId: accessKeyId,
	secretAccessKey: secretAccessKey
})

const houseAddress = 'house'

function processMessage(msg) {
	const msgObj = JSON.parse(msg)
	const params = {fromAddress: msgObj.toAddress, toAddress: houseAddress, amount: msgObj.amount}
	request.post({url: 'http://jobcoin.gemini.com/wrongness/api/transactions', form: params}, function(err) {
		if (err) throw err
		producer.send({id:'id',body:msg}, function(err) {
			if (err) throw err
			console.log(JSON.stringify(params))
		})
	})
}

const app = Consumer.create({
	queueUrl: depositUrl,
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
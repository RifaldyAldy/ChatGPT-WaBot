const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

const GPT = async (chat) => {
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `${chat}`,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });

  return response.data.choices[0].text;
};

GPT()
  .then((result) => {
    console.log(result);
  })
  .catch((e) => {
    console.log('Error : ', e);
  });
module.exports = GPT;

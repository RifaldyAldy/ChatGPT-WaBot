const { Configuration, OpenAIApi } = require('openai');

const key = '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';
// const key = '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';
const configuration = new Configuration({
  apiKey: key,
  baseURL: 'https://api.openai.com/v1/chat/completions',
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

  // return response.data.choices[0].text;
  return response.data.choices[0].text || 'saya tidak tau!';
};

GPT()
  .then((result) => {
    console.log(result);
  })
  .catch((e) => {
    console.log(e);
  });

module.exports = GPT;

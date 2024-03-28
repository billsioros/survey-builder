class SurveyBuilder {
  constructor(
    showQuestionNumbers = "onPage",
    showProgressBar = "bottom",
    firstPageIsStarted = true
  ) {
    this.surveyJSON = {
      title: null,
      description: null,
      pages: [],
      clearInvisibleValues: "none",
      showQuestionNumbers: showQuestionNumbers,
      showProgressBar: showProgressBar,
      firstPageIsStarted: firstPageIsStarted,
    };

    this.endpoint = {
      verb: null,
      url: null,
    };
  }

  withTitle(title) {
    this.surveyJSON.title = title;

    return this;
  }

  withDescription(description) {
    this.surveyJSON.description = description;

    return this;
  }

  addPage(page) {
    this.surveyJSON.pages.push(page);

    return this;
  }

  addPages(...pages) {
    for (let page of pages) {
      this.addPage(page);
    }

    return this;
  }

  addSection(data, buildFunction) {
    const pages = data.map((item, index) => {
      const pageBuilder = new PageBuilder(index + 1);
      buildFunction(pageBuilder, item);
      return pageBuilder.build();
    });

    return this.addPages(...pages);
  }

  addIntroduction(buildFunction) {
    const introductionBuilder = new IntroductionBuilder();
    buildFunction(introductionBuilder);
    return this.addPage(introductionBuilder.build());
  }

  addDemographics(buildFunction) {
    const demographicsBuilder = new DemographicsBuilder();
    buildFunction(demographicsBuilder);
    return this.addPage(demographicsBuilder.build());
  }

  addFeedback() {
    const feedbackPage = {
      name: "Feedback",
      elements: [
        {
          type: "comment",
          name: "feedback",
          title: "We would be glad to receive your feedback. (optional)",
          hideNumber: true,
        },
      ],
      title: "Feedback",
      description: "",
    };

    return this.addPage(feedbackPage);
  }

  withEndpoint(url, verb = "POST") {
    this.endpoint = {
      verb: verb,
      url: url,
    };

    return this;
  }

  build() {
    const onComplete = (sender, options) => {
      options.showDataSaving();

      $.ajax({
        type: this.endpoint.verb,
        url: this.endpoint.url,
        contentType: "application/json",
        data: JSON.stringify(sender.data),
        dataType: "json",
        success: function (response) {
          console.info(response);
          options.showDataSavingSuccess();
        },
        error: function (err) {
          console.error(err);
          options.showDataSavingError();
        },
      });
    };

    document.title = this.surveyJSON.title;

    // Construct the survey div dynamically
    const div = document.createElement("div");
    div.id = "survey";

    // Get the main element
    const mainElement = document.querySelector("main");

    // Append the div inside the main element
    mainElement.appendChild(div);

    var survey = new Survey.Model(this.surveyJSON);

    $(`#${div.id}`).Survey({
      model: survey,
      onComplete: onComplete.bind(this),
    });
    return survey;
  }
}

class DemographicsBuilder {
  constructor() {
    this.questions = [];
  }

  addMultipleChoiceQuestion(name, title, values, isRequired = true) {
    const choices = values.map((item, index) => ({
      value: index + 1,
      text: item,
    }));

    const question = {
      type: "radiogroup",
      name: `demographics-${name}`,
      title: title,
      isRequired: isRequired,
      choices: choices,
      hasOther: false,
    };

    this.questions.push(question);

    return this;
  }

  addRatingQuestion(name, title, minRateDescription, maxRateDescription, isRequired = true) {
    const question = {
      type: "rating",
      name: `demographics-${name}`,
      title: title,
      isRequired: isRequired,
      minRateDescription: minRateDescription,
      maxRateDescription: maxRateDescription,
    };

    this.questions.push(question);

    return this;
  }

  withAgeQuestion(...choices) {
    return this.addMultipleChoiceQuestion(
      "age",
      "How old are you?",
      choices
    );
  }

  withGenderQuestion(...choices) {
    return this.addMultipleChoiceQuestion(
      "gender",
      "What is your gender?",
      choices
    );
  }

  withFamiliarityQuestion(subject) {
    return this.addRatingQuestion(
      "familiarity",
      `Are you familiar with ${subject}?`,
      "Amateur",
      "Expert"
    );
  }

  build() {
    const demographicsPage = {
      name: "Demographics",
      elements: this.questions,
      title: "Demographics",
      description: "Please answer the following demographic questions.",
    };

    return demographicsPage;
  }
}

class IntroductionBuilder {
  constructor() {
    this.sentences = [];
  }

  withEstimatedDuration(minDuration, maxDuration) {
    this.sentences.push(
      `<p><strong>Estimated time duration to complete the survey:</strong> ${minDuration} to ${maxDuration} minutes</p>`
    );
    return this;
  }

  withContactInfo(emailAddress) {
    this.sentences.push(
      `<p> <strong>For questions please contact:</strong> <a href="mailto:${emailAddress}">${emailAddress}</a> </p>`
    );
    return this;
  }

  withSupportedBrowsers(...browsers) {
    if (browsers.length === 0) {
      browsers = ["Firefox", "Chrome", "Safari"]; // Default browsers
    }

    this.sentences.push(
      `<p><strong>Supported Browsers:</strong> ${browsers.join(", ")}</p>`
    );

    return this;
  }

  addSeparator() {
    this.sentences.push("<br><br>");

    return this;
  }

  withDescription(...sentences) {
    this.sentences.push(...sentences.map(sentence => `<p>${sentence}</p>`));

    return this;
  }

  build() {
    return {
      name: "Introduction",
      elements: [
        {
          type: "html",
          name: "Information",
          html: this.sentences.join("\n"),
        },
      ],
      title: "Description:",
    };
  }
}

class PageBuilder {
  constructor(pageNumber) {
    this.pageNumber = pageNumber;
    this.page = {
      name: null,
      title: null,
      description: null,
      questions: [],
    };
    this.totalNumberOfQuestions = 0;
  }

  withTitle(title) {
    this.page.name = title;
    this.page.title = title;

    return this;
  }

  withDescription(description) {
    this.page.description = description;

    return this;
  }

  addQuestion(question) {
    question.name = `${this.page.title.toLowerCase()}-${this.pageNumber}-${++this.totalNumberOfQuestions}`;

    this.page.questions.push(question);

    return this;
  }

  addHtml(html) {
    const question = {
      name: `${this.page.title.toLowerCase()}-${this.pageNumber}-html`,
      type: "html",
      html: html,
    };

    this.page.questions.push(question);

    return this;
  }

  addAnnotation(name, value) {
    const question = {
        "type": "text",
        "name": `${this.page.title.toLowerCase()}-${this.pageNumber}-${name}`,
        "visible": false,
        "defaultValue": value
    };

    this.page.questions.push(question);

    return this;
  }

  addRatingQuestion(
    title,
    minRateDescription = "Significant Deviation",
    maxRateDescription = "Perfect Match",
    rateMin = 1,
    rateMax = 5,
    rateStep = 1,
    isRequired = true
  ) {
    const question = {
      type: "rating",
      title: title,
      isRequired: isRequired,
      rateMin: rateMin,
      rateMax: rateMax,
      rateStep: rateStep,
      minRateDescription: minRateDescription,
      maxRateDescription: maxRateDescription,
    };

    return this.addQuestion(question);
  }

  addMultipleChoiceQuestion(title, numChoices, isRequired = true) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const choices = Array.from({ length: numChoices }, (_, index) => alphabet[index]);

    const question = {
      type: "rating",
      title: title,
      isRequired: isRequired,
      rateValues: choices.map((item, index) => ({
        value: index + 1,
        text: item,
      })),
      rateMax: 2,
    };

    return this.addQuestion(question);
  }

  build() {
    return this.page;
  }
}

// Helper method to group data by specified keys
function groupDataByKey(data, keys) {
    const groupedData = {};
    data.forEach(entry => {
        const key = keys.map(k => entry[k]).join('|');
        if (!groupedData[key]) {
            groupedData[key] = [];
        }
        groupedData[key].push(entry);
    });
    return groupedData;
}

// Helper method to pick samples from each group randomly while stratifying by Edit and Category
function sample(groups, totalSamples) {
    const groupKeys = Object.keys(groups);

    // Ensure we have at least 4 groups
    if (groupKeys.length < totalSamples) {
        throw new Error(`There must be at least ${totalSamples} groups.`);
    }

    // Randomly select 4 different groups
    const selectedGroups = [];
    while (selectedGroups.length < totalSamples) {
        const randomIndex = Math.floor(Math.random() * groupKeys.length);
        const randomGroup = groupKeys[randomIndex];
        if (!selectedGroups.includes(randomGroup)) {
            selectedGroups.push(randomGroup);
        }
    }

    // Pick one sample from each selected group
    const samples = [];
    for (let group of selectedGroups) {
        const numSamples = groups[group].length;
        const randomIndex = Math.floor(Math.random() * numSamples);
        samples.push(groups[group][randomIndex]);
    }

    return samples;
}

// Function to collect naturalness samples
function collectNaturalnessSamples(data, numberOfSamples = 4) {
    // Group data by Edit and Category
    const groupedData = groupDataByKey(data, ['Edit', 'Category']);

    // Perform stratified sampling
    const samples = sample(groupedData, numberOfSamples);

    // Construct a list of items with source prompt and source paths for both models
    const resultList = samples.map((sample, index) => {
        const sourcePrompt = sample['Source Prompt'];
        const seed = sample['Seed'];

        // Find the respective entries for both models based on the source prompt and seed
        const musicGenEntry = data.find(entry => entry['Source Prompt'] === sourcePrompt && entry['Seed'] === seed && entry['Model'] === 'MusicGen');
        const auffusionEntry = data.find(entry => entry['Source Prompt'] === sourcePrompt && entry['Seed'] === seed && entry['Model'] === 'Auffusion');

        // Determine which path to use based on the index
        const promptType = index < numberOfSamples / 2 ? "Source" : "Edited";

        return {
            'Type': promptType,
            'Edit': sample['Edit'],
            'Category': sample['Category'],
            'MusicGen Path': musicGenEntry[`${promptType} Path`],
            'Auffusion Path': auffusionEntry[`${promptType} Path`]
        };
    });

    return resultList;
}

// Function to collect faithfulness samples
function collectFaithfulnessSamples(data, numberOfSamples = 16) {
    const groupedDataModel1 = groupDataByKey(data.filter(item => item.Model === 'MusicGen'), ['Edit', 'Category']);
    const groupedDataModel2 = groupDataByKey(data.filter(item => item.Model === 'Auffusion'), ['Edit', 'Category']);

    const samplesModel1 = sample(groupedDataModel1, Math.floor(numberOfSamples / 2));
    const samplesModel2 = sample(groupedDataModel2, Math.floor(numberOfSamples / 2));

    return [...samplesModel1, ...samplesModel2];
}

function generateAudioHTML(path) {
  return `<audio controls style=\"border-radius: 30px;border: 1px solid #19b394;\"><source src="${window.location.href}static/data/${path}" type="audio/wav">Your browser does not support the <code>audio</code> element.</audio>`;
}

function getEditEvaluationHTML(item) {
  const sourcePrompt = item["Source Prompt"];
  const editedPrompt = item["Edited Prompt"];

  const sourcePath = item["Source Path"];
  const editedPath = item["Edited Path"];

  const sourceHTML = generateAudioHTML(sourcePath);
  const editedHTML = generateAudioHTML(editedPath);

  return `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; justify-content: space-evenly;">
            <div style="flex: 1;">
              <p>Description</p>
              <p style="font-weight: bold; padding: 5px 0;">${sourcePrompt}</p>
            </div>
            <div style="flex: 1;">
              <p>Audio</p>
              ${sourceHTML}
            </div>
          </div>
          <div style="display: flex; justify-content: space-evenly;">
            <div style="flex: 1;">
              <p>Description</p>
              <p style="font-weight: bold; padding: 5px 0;">${editedPrompt}</p>
            </div>
            <div style="flex: 1;">
              <p>Audio</p>
              ${editedHTML}
            </div>
          </div>
        </div>
    `;
}

function getModelComparisonHTML(item) {
  const musicGenPath = item["MusicGen Path"];
  const auffusionPath = item["Auffusion Path"];

  const musicGenHTML = generateAudioHTML(musicGenPath);
  const auffusionHTML = generateAudioHTML(auffusionPath);

  return `
        <div style="display: flex; justify-content: space-evenly;">
          <div>${musicGenHTML}</div>
          <div>${auffusionHTML}</div>
        </div>
    `;
}

$.getJSON("static/data/entries.json", function (data) {
  const naturalnessAudioPairs = collectNaturalnessSamples(data);
  const faithfulnessAudioPairs = collectFaithfulnessSamples(data);

  console.debug(naturalnessAudioPairs);
  console.debug(faithfulnessAudioPairs);

  const surveyBuilder = new SurveyBuilder();

  surveyBuilder
    .withTitle("Performance Evaluation of Autoregressive Audio Editing")
    .withDescription(
      "Performance Evaluation in the context of \"Harnessing Cross Attention Control for Instruction-Based Autoregressive Audio Editing\""
    )
    .addIntroduction(introductionBuilder =>
      introductionBuilder
        .withDescription(
          "This survey aims to assess the naturalness and faithfulness of audio samples through two distinct sections: Naturalness and Faithfulness.",
          "In the Naturalness section, participants encounter four 10-second audio clips and are prompted to rate their naturalness on a scale of 1 to 5, aiming to assess how closely these samples resemble real-world sounds.",
          "Meanwhile, the Faithfulness section comprises 16 additional 10-second audio samples, each accompanied by four questions.\
          These questions evaluate the extent to which the audio adheres to its given description and preserves key elements such as melody, dynamics, and tempo.",
          "Participants are tasked with selecting the audio sample that best embodies the specified characteristics, providing valuable insights into perceived audio quality and fidelity."
        )
        .addSeparator()
        .withEstimatedDuration(5, 10)
        .withSupportedBrowsers()
        .withContactInfo("billsioros97@gmail.com")
    )
    .addDemographics(demographicsBuilder =>
      demographicsBuilder
        .withAgeQuestion("under 20", "20 to 30")
        .withGenderQuestion("Male", "Female")
        .withFamiliarityQuestion("Machine Learning and Artificial Inteligence")
    )
    .addSection(naturalnessAudioPairs, (pageBuilder, item) =>
      pageBuilder
        .withTitle("Naturalness")
        .withDescription(
          "Listen to the provided audio clips and choose the one that sounds the most natural to you."
        )
        .addHtml(getModelComparisonHTML(item))
        .addAnnotation('type', item['Type'])
        .addAnnotation('edit', item['Edit'])
        .addAnnotation('category', item['Category'])
        .addMultipleChoiceQuestion("Which of the previous audio clips sounds the most natural to you?", 2)
    )
    .addSection(faithfulnessAudioPairs, (pageBuilder, item) =>
      pageBuilder
        .withTitle("Faithfulness")
        .withDescription(
          "Listen to the provided audio clips and answer the following questions."
        )
        .addHtml(getEditEvaluationHTML(item))
        .addAnnotation('edit', item['Edit'])
        .addAnnotation('category', item['Category'])
        .addAnnotation('model', item['Model'])
        .addRatingQuestion("How accurately does the edited audio preserve the melody of the original source?")
        .addRatingQuestion("How faithfully does the edited audio preserve the intensity and dynamics of the original source?")
        .addRatingQuestion("How faithfully does the edited audio maintain the tempo of the original source?")
        .addRatingQuestion("How closely does the edited audio align with the edited audio text prompt?")
    )
    .addFeedback();

  surveyBuilder.withEndpoint("/data").build();
});

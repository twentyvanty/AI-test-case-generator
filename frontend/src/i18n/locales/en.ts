const en = {
  translation: {
    common: {
      login: "Login",
      logout: "Logout",
      cancel: "Cancel",
      create: "Create",
      loading: "Loading...",
      language: "Language",
    },

    app: {
      name: "AI Test Case Generator",
    },

    login: {
      title: "AI Test Case Generator",
      description: "Please log in to continue.",
    },

    nav: {
      main: "Main navigation",
      dashboard: "Dashboard",
      workspace: "Workspace",
      history: "History",
      account: "Account",
    },

    sidebar: {
      sections: "Sections",
      recentRuns: "Recent runs",
    },

    userMenu: {
      open: "Open user menu",
    },

    dashboard: {
      title: "Dashboard",
      period: "last 7 days",
      loadError: "Failed to load dashboard data.",
      vsLastWeek: "{{delta}} vs last week",

      stats: {
        totalTestCases: "Total test cases",
        passRate: "Pass rate",
        failingCases: "Failing cases",
        runsThisWeek: "Runs this week",
      },

      weeklyActivity: "Weekly activity",
      techniqueMix: "Technique mix",
      failingByArea: "Failing by area",
      caseCount_one: "{{count}} case",
      caseCount_other: "{{count}} cases",
      failCount_one: "{{count}} fail",
      failCount_other: "{{count}} fail",

      quickActions: "Quick actions",
      startNewRun: "Start a new run",
      projectOverview: "Project overview",
      browseHistory: "Browse run history",
      recentRuns: "Recent runs",
    },

    techniques: {
      boundaryValue: "Boundary value",
      equivalencePartitioning: "Equivalence partitioning",
      decisionTable: "Decision table",
      stateTransition: "State transition",
    },

    techniqueDescriptions: {
      equivalencePartitioning:
        "Group inputs into valid and invalid classes, and test one value from each.",
      boundaryValue: "Test the edges of every range: just below, on and just above each limit.",
      decisionTable: "Test each combination of conditions and the outcome it should give.",
      stateTransition: "Test the allowed and forbidden moves between the system's states.",
    },

    days: {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
    },

    workspace: {
      title: "Projects",
      newProject: "New project",
      noDescription: "No description",
      loadError: "Failed to load projects.",
      emptyTitle: "No projects yet",
      emptyDescription: "Create a project to start adding requirements.",
      requirementCount_one: "{{count}} requirement",
      requirementCount_other: "{{count}} requirements",
      updated: "Updated {{time}}",
      openProject: "Open project",
    },

    requirements: {
      title: "Requirements",
      addTitle: "Add requirement",
      empty: "No requirements yet. Add one to start generating test cases.",
      scenarioCount_one: "{{count}} scenario",
      scenarioCount_other: "{{count}} scenarios",
      open: "Open requirement",
    },

    coverage: {
      title: "Coverage & traceability",
      empty: "No test cases yet.",
      failingCases: "failing cases",
      mappedCases: "mapped cases",
    },

    dropzone: {
      title: "Drop files here, or click to choose",
      hint: "PDF, DOCX, Markdown, TXT (up to 20 MB) or images: PNG, JPG, WebP (up to 5 MB) — 5 files at a time",
      tooLarge: "{{name}} is larger than {{limit}} MB.",
      unsupported: "{{name}} isn't a PDF, DOCX, Markdown, TXT, PNG, JPG or WebP file.",
    },

    requirementPage: {
      backToProject: "Back to project",
      notFound: "Requirement not found.",
      newEyebrow: "New",
      newTitle: "New requirement",
      description:
        "Describe what the system must do, attach documents if you have them, then choose how the test cases should be designed.",
      working: "AI working…",
      aiFailed: "The AI couldn't finish: {{message}}",
      delete: "Delete",
      deleting: "Deleting…",
      deleteTitle: "Delete this requirement?",
      deleteDescription:
        "{{code}} and its scenarios, test cases and generation history move to History → Recently deleted, where you can restore them for 7 days.",
    },

    requirementStatus: {
      DRAFT: "Draft",
      SCENARIOS_READY: "Scenarios ready",
      CASES_READY: "Test cases ready",
      REPORTED: "Reported",
    },

    steps: {
      requirement: "Requirement",
      scenarios: "Scenarios",
      testCases: "Test cases",
      testScripts: "Test scripts",
      report: "Report",
    },

    requirementStep: {
      describeTitle: "Describe the requirement",
      titleLabel: "Title",
      titlePlaceholder: "e.g. Password reset by email",
      detailsLabel: "Details",
      detailsPlaceholder:
        "What must the system do? Include rules, limits and error cases, e.g. “Users can reset their password via an email link. The link expires after 30 minutes.”",
      characters_one: "{{count}} character",
      characters_other: "{{count}} characters",
      textChanged:
        "The details changed after the scenarios were drafted. Draft again to update the scenarios.",
      filesTitle: "Attach specification files (optional)",
      filesHint: "Have the requirement in a document? Add it here instead of typing it.",
      techniquesTitle: "Choose testing techniques",
      techniquesHint: "Pick one or more, or let the AI choose for you.",
      save: "Save draft",
      saving: "Saving…",
      saved: "Saved",
      delete: "Delete requirement",
      draft: "Draft scenarios",
      redraft: "Draft scenarios again",
      drafting:
        "Drafting scenarios… this usually takes under a minute, but can take longer when the AI is busy.",
      suggesting: "Asking the AI which techniques fit…",
      missing: "Add a title and details to continue.",
      redraftNote: "Drafting again replaces the current scenarios.",
      openScenarios: "Open scenarios",
      lockedNote:
        "These scenarios already have test cases, so they can't be drafted again. Add or generate more scenarios in step 2.",
      textChangedLocked:
        "The details changed after the test cases were generated. Existing scenarios and test cases stay as they are; add or generate more scenarios in step 2 for anything new.",
    },

    specificationFiles: {
      reading: "Reading {{name}}…",
      readingImage: "Reading {{name}} with AI… this can take up to a minute.",
      remove: "Remove {{name}}",
      noText:
        "No text found in {{name}}. If it's a scanned document, upload it as an image (PNG or JPG) or type the requirement instead.",
      noTextImage: "The AI found no text in {{name}}. Please type the requirement instead.",
      aiFailed: "Couldn't read {{name}}: {{message}}",
      readByAi: "Read by AI, please check",
      hint: "The text of each file is added to the details above, so you can check and edit what the AI will read. Images are read by AI and may contain small mistakes — please check that text carefully.",
    },

    techniquePicker: {
      selected: "Selected",
      aiChooseName: "Let AI choose",
      aiChooseDescription: "The AI picks the techniques that fit this requirement.",
      suggest: "Suggest with AI",
      suggesting: "Suggesting…",
      suggestHint: "The AI selects the techniques that fit and explains why.",
      aiReason: "AI: {{reason}}",
    },

    scenariosStep: {
      title: "Review generated scenarios",
      description:
        "Check the scenarios. Edit, add, delete or generate more before creating test cases.",
      add: "Add scenario",
      generateMore: "Generate more",
      redraft: "Redraft",
      history: "History",
      generateCases_one: "Generate {{count}} test case",
      generateCases_other: "Generate {{count}} test cases",
      viewCases: "View test cases",
      generatingCases_one:
        "Writing test cases for {{count}} scenario… This usually takes up to about {{minutes}} minutes. Please keep this page open.",
      generatingCases_other:
        "Writing test cases for {{count}} scenarios… This usually takes up to about {{minutes}} minutes. Please keep this page open.",
      casesPartial:
        "Test cases were saved for {{done}}. The rest couldn't be generated: {{message}} Click Generate again for the remaining scenarios.",
      generatedCount_one: "{{count}} test case generated",
      generatedCount_other: "{{count}} test cases generated",
      lockedNote: "Scenarios with test cases are locked",
      lockedCases_one: "{{count}} test case",
      lockedCases_other: "{{count}} test cases",
      lockedHint:
        "Locked because it has test cases. To change it, delete it (its test cases go with it) and add a new one.",
      redraftLocked: "Scenarios with test cases can't be redrafted. Use Generate more or Add scenario.",
      deletedWithCases_one: "{{code}} and its {{count}} test case moved to Recently deleted. You can restore them for 7 days.",
      deletedWithCases_other: "{{code}} and its {{count}} test cases moved to Recently deleted. You can restore them for 7 days.",
      confirmDeleteWithCases_one:
        "Its {{count}} test case will be deleted too, including its Pass/Fail result. Both move to History → Recently deleted, where you can restore them for 7 days.",
      confirmDeleteWithCases_other:
        "Its {{count}} test cases will be deleted too, including their Pass/Fail results. They move to History → Recently deleted, where you can restore them for 7 days.",
      scenarioCount_one: "{{count}} scenario",
      scenarioCount_other: "{{count}} scenarios",
      caseCount_one: "~{{count}} test case",
      caseCount_other: "~{{count}} test cases",
      estimatedCases_one: "~{{count}} test case",
      estimatedCases_other: "~{{count}} test cases",
      manual: "added by you",
      edit: "Edit",
      delete: "Delete",
      newScenario: "New scenario",
      generatingMore: "Asking the AI for more scenarios… this can take a minute or two.",
      restoring: "Restoring…",
      restored: "The earlier draft is back.",
      deleted: "{{code}} moved to Recently deleted. You can restore it for 7 days.",
      openHistory: "Open History",
      confirmDeleteTitle: "Delete {{code}}?",
      confirmDeleteText:
        "It moves to History → Recently deleted, where you can restore it for 7 days.",
      confirmRedraftTitle: "Redraft all scenarios?",
      confirmRestoreTitle: "Restore this draft?",
      confirmReplaceText:
        "Your current scenarios, including your edits, will be replaced. Earlier drafts stay in History.",
    },

    scenarioForm: {
      title: "Title",
      description: "Description",
      technique: "Technique",
      noTechnique: "No technique",
      estimatedCases: "Estimated test cases",
      save: "Save",
      saving: "Saving…",
    },

    scenarioHistory: {
      title: "Draft history",
      description: "The last 10 scenario drafts. Restore one to get its scenarios back.",
      empty: "No drafts yet.",
      latest: "(latest)",
      count_one: "{{count}} scenario",
      count_other: "{{count}} scenarios",
      restore: "Restore",
      close: "Close",
      mode: {
        replace: "Draft",
        more: "Generate more",
      },
      lockedNote:
        "Earlier drafts can't be restored once scenarios have test cases, because restoring would replace them.",
    },

    review: {
      title: {
        scenarios: "The AI's last draft needs your review",
        testCases: "The AI's last test cases need your review",
      },
      text_one:
        "After {{count}} attempt, the AI's own checks still flagged these problems. You decide: fix them yourself, or mark them as reviewed.",
      text_other:
        "After {{count}} attempts, the AI's own checks still flagged these problems. You decide: fix them yourself, or mark them as reviewed.",
      group: {
        scenarios: {
          coverage: "Missing from your scenarios",
          technique: "Technique not applied correctly",
          other: "Other things to check",
        },
        testCases: {
          coverage: "Not covered by the test cases",
          technique: "Technique not applied correctly",
          other: "Other things to check",
        },
      },
      addForIssue: "Add a scenario for this",
      hint: {
        scenarios: {
          technique: "Edit the scenario named in the issue, or redraft.",
          other: "Edit or delete the scenario mentioned.",
        },
        testCases: {
          coverage: "Edit the test cases of that scenario, or delete the scenario and add a better one.",
          technique: "Edit the test cases named in the issue.",
          other: "Edit or delete the test cases mentioned.",
        },
      },
      markReviewed: "Mark as reviewed",
      reminder: "To cover:",
      notesTitle_one: "AI notes to check ({{count}})",
      notesTitle_other: "AI notes to check ({{count}})",
      notesText: {
        scenarios: "The AI's checks passed, but noted these points. Worth a quick look:",
        testCases: "The AI's checks passed, but noted these points. Worth a quick look before running the tests:",
      },
    },

    caseSync: {
      title: "Test cases may be out of date",
      text_one: "{{count}} scenario was added after the test cases were generated and has no test cases yet:",
      text_other: "{{count}} scenarios were added after the test cases were generated and have no test cases yet:",
      added: "{{code}} “{{title}}”",
      generate_one: "Generate {{count}} test case for them",
      generate_other: "Generate {{count}} test cases for them",
    },

    testCasesStep: {
      title: "Test cases & validation",
      summary_one: "{{count}} case · {{pass}} Pass · {{fail}} Fail",
      summary_other: "{{count}} cases · {{pass}} Pass · {{fail}} Fail",
      backToScenarios: "Back to scenarios",
      downloadTable: "Download test case table",
      downloadReport: "Download report",
      exportNote: "Export includes test cases from this requirement only.",
      empty: "No test cases yet. Go back to the scenarios to generate them.",
      scenario: "{{title}}",
      statusOf: "Status of {{code}}",
      reportTitle: "Coverage & traceability report",
      syncBanner_one: "{{count}} scenario has no test cases yet.",
      syncBanner_other: "{{count}} scenarios have no test cases yet.",
      syncReview: "Review changes",
      actionsFor: "Actions for {{code}}",
      edit: "Edit",
      delete: "Delete",
      editTitle: "Edit {{code}}",
      confirmDeleteTitle: "Delete {{code}}?",
      confirmDeleteText:
        "It moves to History → Recently deleted, where you can restore it for 7 days. When a scenario has no test cases left, it can be edited again.",
      fields: {
        title: "Title",
        precondition: "Precondition",
        steps: "Steps",
        stepsHint: "One step per line",
        expected: "Expected result",
      },
      save: "Save",
      saving: "Saving…",
      errTitle: "Add a title.",
      errSteps: "Add at least one step.",
      errExpected: "Add the expected result.",
      columns: {
        id: "ID",
        title: "Title",
        precondition: "Precondition",
        steps: "Steps",
        expected: "Expected result",
        status: "Status",
        actions: "Actions",
      },
    },

    testCaseStatus: {
      OPEN: "Open",
      PASS: "Pass",
      FAIL: "Fail",
    },

    stepPlaceholder: {
      testCases_one:
        "{{count}} test case is ready. The test case page (table, Pass / Fail, edit, downloads) comes in the next update.",
      testCases_other:
        "{{count}} test cases are ready. The test case page (table, Pass / Fail, edit, downloads) comes in the next update.",
      backToScenarios: "Back to scenarios",
      testScripts: "Generating automated test scripts from your test cases comes in a later update. This step is optional.",
      report: "The full report with defects comes in the next update. For now, download the report from the test cases step.",
      back: "Back to test cases",
    },

    historyGenerated: {
      title: "Generated",
      description: "Finished AI generations of scenarios and test cases, newest first. Open one to see the result.",
      filter: {
        all: "All",
        scenarios: "Scenarios",
        testCases: "Test cases",
      },
      kind: {
        scenarios: "Scenarios",
        testCases: "Test cases",
      },
      scenarioCount_one: "{{count}} scenario",
      scenarioCount_other: "{{count}} scenarios",
      caseCount_one: "{{count}} test case",
      caseCount_other: "{{count}} test cases",
      mode: {
        replace: "Draft",
        more: "Generate more",
      },
      empty: "Nothing generated yet.",
      open: "Open",
      showAll: "Show all ({{count}})",
      showLess: "Show less",
    },

    runStatus: {
      PASSED: "Passed",
      NEEDS_REVIEW: "Needs review",
      FAILED: "Failed",
    },

    historyPage: {
      title: "History",
      moreSoon: "The full history of AI generations across your projects is coming in a later update.",
    },

    recentlyDeleted: {
      title: "Recently deleted",
      description:
        "Deleted requirements, scenarios and test cases stay here for 7 days. After that they're removed for good.",
      empty: "Nothing here. Items you delete appear here for 7 days.",
      type: {
        requirement: "Requirement",
        scenario: "Scenario",
        testCase: "Test case",
      },
      withTestCases_one: "+ {{count}} test case (restored with it)",
      withTestCases_other: "+ {{count}} test cases (restored with it)",
      inProject: "in {{project}}",
      inRequirement: "in “{{requirement}}” · {{project}}",
      deleted: "Deleted {{time}}",
      daysLeft_one: "{{count}} day left",
      daysLeft_other: "{{count}} days left",
      restore: "Restore",
      working: "Working…",
      deleteForever: "Delete forever",
      restored: "Restored.",
      open: "Open it",
      confirmTitle: "Delete forever?",
      confirmText: "“{{title}}” will be removed for good. This can't be undone.",
    },

    comingSoon: {
      title: "Coming soon",
      description: "This page is still being designed.",
    },

    project: {
      backToProjects: "Back to projects",
      loadError: "Failed to load this project.",
      createError: "Could not create the project. Please try again.",
      createTitle: "Create New Project",
      createDescription:
        "Create a project to start generating test cases.",
      projectName: "Project Name",
      projectNamePlaceholder: "e.g. E-Commerce Website",
      description: "Description",
      descriptionPlaceholder: "Describe your project...",
      creating: "Creating...",
      createProject: "Create Project",
    },
  },
};

export default en;

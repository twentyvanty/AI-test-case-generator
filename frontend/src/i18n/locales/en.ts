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
      hint: "PDF, DOCX, Markdown or TXT — up to 20 MB each, 5 at a time",
      tooLarge: "{{name}} is larger than 20 MB.",
      unsupported: "{{name}} isn't a PDF, DOCX, Markdown or TXT file.",
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
        "{{code}} and all its scenarios, test cases and generation history will be deleted. This can't be undone.",
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
    },

    specificationFiles: {
      reading: "Reading {{name}}…",
      remove: "Remove {{name}}",
      noText:
        "No text found in {{name}}. If it's a scanned image, please type the requirement instead.",
      hint: "The text of each file is added to the details above, so you can check and edit what the AI will read.",
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

    scenarioPreview: {
      title: "Drafted scenarios",
      count_one: "{{count}} scenario",
      count_other: "{{count}} scenarios",
      note: "Editing, selecting and adding scenarios is coming in the next update.",
      noTechnique: "No technique",
      estimatedCases_one: "~{{count}} test case",
      estimatedCases_other: "~{{count}} test cases",
      needsReviewTitle: "Please review these scenarios",
      needsReviewText:
        "The AI checks still found problems after 3 attempts. Check the scenarios below carefully:",
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

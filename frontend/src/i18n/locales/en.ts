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
      aiChoose: "AI-choose",
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
      add: "Add requirement",
      text: "Requirement text",
      textPlaceholder: "e.g. Users must be able to reset their password via email link…",
      empty: "No requirements yet. Add one to start generating test cases.",
      caseCount_one: "{{count}} case",
      caseCount_other: "{{count}} cases",
      coverage: "{{percent}}% coverage",
      open: "Open requirement",
    },

    coverage: {
      title: "Coverage & traceability",
      reportTitle: "Coverage & traceability report",
      empty: "No test cases yet.",
      failingCases: "failing cases",
      mappedCases: "mapped cases",
    },

    dropzone: {
      title: "Drop requirement files",
      hint: "PDF, DOCX, Markdown — up to 20 MB",
      remove: "Remove file",
      tooLarge: "File is larger than 20 MB.",
    },

    requirementPage: {
      backToProject: "Back to project",
      notFound: "Requirement not found.",
    },

    requirementStatus: {
      success: "Success",
      notGenerated: "Not generated",
      generating: "Generating…",
    },

    steps: {
      setup: "Setup",
      review: "Review scenarios",
      validate: "Validate & report",
    },

    setup: {
      hint: "Pick the technique(s) and an AI module before generating.",
      technique: "Technique",
      aiModule: "AI module",
      generate: "Generate test cases",
      generating: "Generating…",
    },

    aiModules: {
      local: {
        name: "Qwen 3 (local)",
        description: "Runs on your machine, no data leaves",
      },
      cloud: {
        name: "Cloud model",
        description: "Best coverage on long requirements",
      },
      auto: {
        name: "Auto-select",
        description: "Picks a module per requirement size",
      },
    },

    review: {
      title: "Review generated scenarios",
      description:
        "Check the scenarios and case counts. Generate more, edit or delete before validating.",
      addScenario: "Add scenario",
      generateMore: "Generate more",
      continue: "Continue to validation",
      scenarioCount_one: "{{count}} scenario",
      scenarioCount_other: "{{count}} scenarios",
      edit: "Edit",
      addCase: "Add case",
      delete: "Delete",
      newScenario: "New scenario",
      newCase: "New test case",
      confirmDeleteScenario: 'Delete scenario "{{title}}" and its test cases?',
    },

    validate: {
      title: "Test case & validation",
      passCount_one: "{{count}} Pass",
      passCount_other: "{{count}} Pass",
      failCount_one: "{{count}} Fail",
      failCount_other: "{{count}} Fail",
      backToScenarios: "Back to scenarios",
      downloadTable: "Download test case table",
      downloadReport: "Download report",
      exportNote: "Export includes test cases from this requirement only.",
      scenarioLabel: "Scenario: {{title}}",
      markPassed: "Mark {{id}} as passed",
      columns: {
        id: "ID",
        title: "Title",
        precondition: "Precondition",
        steps: "Steps",
        expected: "Expected result",
        status: "Status",
      },
    },

    testStatus: {
      pass: "Pass",
      fail: "Fail",
      open: "Open",
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

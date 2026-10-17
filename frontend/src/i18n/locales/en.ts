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

    scenariosStep: {
      title: "Review generated scenarios",
      description:
        "Check the scenarios and their priority. Edit, add, delete or generate more before creating test cases.",
      add: "Add scenario",
      generateMore: "Generate more",
      redraft: "Redraft",
      history: "History",
      generateCases_one: "Generate {{count}} test case",
      generateCases_other: "Generate {{count}} test cases",
      generateCasesSoon: "Test case generation comes in the next update",
      scenarioCount_one: "{{count}} scenario",
      scenarioCount_other: "{{count}} scenarios",
      caseCount_one: "~{{count}} test case",
      caseCount_other: "~{{count}} test cases",
      estimatedCases_one: "~{{count}} test case",
      estimatedCases_other: "~{{count}} test cases",
      manual: "added by you",
      priorityOf: "Priority of {{code}}",
      edit: "Edit",
      delete: "Delete",
      newScenario: "New scenario",
      generatingMore: "Asking the AI for more scenarios… this can take a minute or two.",
      restoring: "Restoring…",
      restored: "The earlier draft is back.",
      deleted: "{{code}} moved to Recently deleted. You can restore it for 7 days.",
      openHistory: "Open History",
      needsReviewTitle: "Please review these scenarios",
      needsReviewText:
        "The AI checks still found problems after 3 attempts. Check the scenarios below carefully:",
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
      priority: "Priority",
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
    },

    priority: {
      HIGH: "High",
      MEDIUM: "Medium",
      LOW: "Low",
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
        "Deleted requirements and scenarios stay here for 7 days. After that they're removed for good.",
      empty: "Nothing here. Items you delete appear here for 7 days.",
      type: {
        requirement: "Requirement",
        scenario: "Scenario",
      },
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

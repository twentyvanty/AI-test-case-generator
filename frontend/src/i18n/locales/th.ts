const th = {
  translation: {
    common: {
      login: "เข้าสู่ระบบ",
      logout: "ออกจากระบบ",
      cancel: "ยกเลิก",
      create: "สร้าง",
      loading: "กำลังโหลด...",
      language: "ภาษา",
    },

    app: {
      name: "AI Test Case Generator",
    },

    login: {
      title: "AI Test Case Generator",
      description: "กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ",
    },

    nav: {
      main: "เมนูหลัก",
      dashboard: "แดชบอร์ด",
      workspace: "พื้นที่ทำงาน",
      history: "ประวัติ",
      account: "บัญชี",
    },

    sidebar: {
      sections: "เมนู",
      recentRuns: "การสร้างล่าสุด",
    },

    userMenu: {
      open: "เปิดเมนูผู้ใช้",
    },

    dashboard: {
      title: "แดชบอร์ด",
      period: "7 วันล่าสุด",
      loadError: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
      vsLastWeek: "{{delta}} จากสัปดาห์ก่อน",

      stats: {
        totalTestCases: "Test Case ทั้งหมด",
        passRate: "อัตราการผ่าน",
        failingCases: "Test Case ที่ไม่ผ่าน",
        runsThisWeek: "จำนวนการสร้างสัปดาห์นี้",
      },

      weeklyActivity: "กิจกรรมรายสัปดาห์",
      techniqueMix: "สัดส่วนเทคนิคที่ใช้",
      failingByArea: "ส่วนที่ไม่ผ่านการทดสอบ",
      caseCount_other: "{{count}} เคส",
      failCount_other: "ไม่ผ่าน {{count}}",

      quickActions: "ทางลัด",
      startNewRun: "เริ่มสร้าง Test Case ใหม่",
      projectOverview: "ภาพรวมโปรเจกต์",
      browseHistory: "ดูประวัติการสร้าง",
      recentRuns: "การสร้างล่าสุด",
    },

    // Technique names are usually kept in English in Thai QA work
    techniques: {
      boundaryValue: "Boundary value",
      equivalencePartitioning: "Equivalence partitioning",
      decisionTable: "Decision table",
      stateTransition: "State transition",
    },

    techniqueDescriptions: {
      equivalencePartitioning:
        "แบ่งข้อมูลเข้าเป็นกลุ่มที่ถูกต้องและไม่ถูกต้อง แล้วทดสอบค่าหนึ่งค่าจากแต่ละกลุ่ม",
      boundaryValue: "ทดสอบค่าที่ขอบของทุกช่วง: ต่ำกว่า เท่ากับ และสูงกว่าขีดจำกัดเล็กน้อย",
      decisionTable: "ทดสอบแต่ละชุดเงื่อนไขและผลลัพธ์ที่ควรได้",
      stateTransition: "ทดสอบการเปลี่ยนสถานะที่อนุญาตและที่ต้องถูกปฏิเสธ",
    },

    days: {
      mon: "จ.",
      tue: "อ.",
      wed: "พ.",
      thu: "พฤ.",
      fri: "ศ.",
      sat: "ส.",
      sun: "อา.",
    },

    workspace: {
      title: "โปรเจกต์",
      newProject: "สร้างโปรเจกต์ใหม่",
      noDescription: "ไม่มีคำอธิบาย",
      loadError: "ไม่สามารถโหลดโปรเจกต์ได้",
      emptyTitle: "ยังไม่มีโปรเจกต์",
      emptyDescription: "สร้างโปรเจกต์เพื่อเริ่มเพิ่มข้อกำหนด",
      requirementCount_other: "{{count}} ข้อกำหนด",
      updated: "อัปเดตเมื่อ {{time}}",
      openProject: "เปิดโปรเจกต์",
    },

    requirements: {
      title: "ข้อกำหนด (Requirements)",
      addTitle: "เพิ่มข้อกำหนด",
      empty: "ยังไม่มีข้อกำหนด เพิ่มข้อกำหนดเพื่อเริ่มสร้าง Test Case",
      scenarioCount_other: "{{count}} สถานการณ์",
      open: "เปิดข้อกำหนด",
    },

    coverage: {
      title: "ความครอบคลุมและการติดตาม",
      empty: "ยังไม่มี Test Case",
      failingCases: "เคสที่ไม่ผ่าน",
      mappedCases: "เคสที่เชื่อมโยงแล้ว",
    },

    dropzone: {
      title: "วางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์",
      hint: "PDF, DOCX, Markdown, TXT (ไม่เกิน 20 MB) หรือรูปภาพ PNG, JPG, WebP (ไม่เกิน 5 MB) — ครั้งละ 5 ไฟล์",
      tooLarge: "{{name}} มีขนาดเกิน {{limit}} MB",
      unsupported: "{{name}} ไม่ใช่ไฟล์ PDF, DOCX, Markdown, TXT, PNG, JPG หรือ WebP",
    },

    requirementPage: {
      backToProject: "กลับไปที่โปรเจกต์",
      notFound: "ไม่พบข้อกำหนดนี้",
      newEyebrow: "ใหม่",
      newTitle: "ข้อกำหนดใหม่",
      description:
        "อธิบายสิ่งที่ระบบต้องทำ แนบเอกสารถ้ามี แล้วเลือกวิธีออกแบบ Test Case",
      working: "AI กำลังทำงาน…",
      aiFailed: "AI ทำงานไม่สำเร็จ: {{message}}",
      delete: "ลบ",
      deleting: "กำลังลบ…",
      deleteTitle: "ลบข้อกำหนดนี้หรือไม่?",
      deleteDescription:
        "{{code}} รวมถึงสถานการณ์ Test Case และประวัติการสร้าง จะถูกย้ายไปที่ ประวัติ → รายการที่เพิ่งลบ และกู้คืนได้ภายใน 7 วัน",
    },

    requirementStatus: {
      DRAFT: "ฉบับร่าง",
      SCENARIOS_READY: "สถานการณ์พร้อมแล้ว",
      CASES_READY: "Test Case พร้อมแล้ว",
      REPORTED: "ออกรายงานแล้ว",
    },

    steps: {
      requirement: "ข้อกำหนด",
      scenarios: "สถานการณ์",
      testCases: "Test Case",
      testScripts: "สคริปต์ทดสอบ",
      report: "รายงาน",
    },

    requirementStep: {
      describeTitle: "อธิบายข้อกำหนด",
      titleLabel: "ชื่อ",
      titlePlaceholder: "เช่น รีเซ็ตรหัสผ่านทางอีเมล",
      detailsLabel: "รายละเอียด",
      detailsPlaceholder:
        "ระบบต้องทำอะไร? ใส่กฎ ขีดจำกัด และกรณีข้อผิดพลาด เช่น “ผู้ใช้สามารถรีเซ็ตรหัสผ่านผ่านลิงก์ทางอีเมล ลิงก์หมดอายุหลัง 30 นาที”",
      characters_other: "{{count}} ตัวอักษร",
      textChanged: "รายละเอียดถูกแก้ไขหลังจากร่างสถานการณ์แล้ว ร่างใหม่อีกครั้งเพื่ออัปเดตสถานการณ์",
      filesTitle: "แนบไฟล์ข้อกำหนด (ไม่บังคับ)",
      filesHint: "มีข้อกำหนดอยู่ในเอกสารแล้ว? แนบไฟล์ที่นี่แทนการพิมพ์",
      techniquesTitle: "เลือกเทคนิคการทดสอบ",
      techniquesHint: "เลือกได้หนึ่งหรือหลายเทคนิค หรือให้ AI เลือกให้",
      save: "บันทึกฉบับร่าง",
      saving: "กำลังบันทึก…",
      saved: "บันทึกแล้ว",
      delete: "ลบข้อกำหนด",
      draft: "ร่างสถานการณ์",
      redraft: "ร่างสถานการณ์ใหม่",
      drafting: "กำลังร่างสถานการณ์… ปกติใช้เวลาไม่ถึงหนึ่งนาที แต่อาจนานกว่านั้นเมื่อ AI มีผู้ใช้งานมาก",
      suggesting: "กำลังถาม AI ว่าเทคนิคใดเหมาะสม…",
      missing: "ใส่ชื่อและรายละเอียดก่อนดำเนินการต่อ",
      redraftNote: "การร่างใหม่จะแทนที่สถานการณ์ปัจจุบัน",
      openScenarios: "เปิดสถานการณ์",
      lockedNote: "สถานการณ์เหล่านี้มี Test Case แล้ว จึงร่างใหม่ไม่ได้ เพิ่มหรือสร้างสถานการณ์เพิ่มได้ในขั้นตอนที่ 2",
      textChangedLocked:
        "รายละเอียดถูกแก้ไขหลังจากสร้าง Test Case แล้ว สถานการณ์และ Test Case เดิมจะยังอยู่เหมือนเดิม เพิ่มหรือสร้างสถานการณ์เพิ่มในขั้นตอนที่ 2 สำหรับส่วนที่เปลี่ยน",
    },

    specificationFiles: {
      reading: "กำลังอ่าน {{name}}…",
      readingImage: "AI กำลังอ่าน {{name}}… อาจใช้เวลาถึงหนึ่งนาที",
      remove: "ลบ {{name}}",
      noText: "ไม่พบข้อความใน {{name}} หากเป็นเอกสารสแกน ให้อัปโหลดเป็นรูปภาพ (PNG หรือ JPG) หรือพิมพ์ข้อกำหนดแทน",
      noTextImage: "AI ไม่พบข้อความใน {{name}} กรุณาพิมพ์ข้อกำหนดแทน",
      aiFailed: "อ่าน {{name}} ไม่สำเร็จ: {{message}}",
      readByAi: "อ่านโดย AI โปรดตรวจสอบ",
      hint: "ข้อความของแต่ละไฟล์จะถูกเพิ่มลงในรายละเอียดด้านบน เพื่อให้คุณตรวจสอบและแก้ไขสิ่งที่ AI จะอ่านได้ รูปภาพจะถูกอ่านโดย AI และอาจมีข้อผิดพลาดเล็กน้อย กรุณาตรวจสอบข้อความนั้นอย่างละเอียด",
    },

    techniquePicker: {
      selected: "เลือกแล้ว",
      aiChooseName: "ให้ AI เลือก",
      aiChooseDescription: "AI จะเลือกเทคนิคที่เหมาะกับข้อกำหนดนี้",
      suggest: "ให้ AI แนะนำ",
      suggesting: "กำลังแนะนำ…",
      suggestHint: "AI จะเลือกเทคนิคที่เหมาะสมและอธิบายเหตุผล",
      aiReason: "AI: {{reason}}",
    },

    scenariosStep: {
      title: "ตรวจสอบสถานการณ์ที่สร้างขึ้น",
      description:
        "ตรวจสอบสถานการณ์ แก้ไข เพิ่ม ลบ หรือสร้างเพิ่ม ก่อนสร้าง Test Case",
      add: "เพิ่มสถานการณ์",
      generateMore: "สร้างเพิ่ม",
      redraft: "ร่างใหม่",
      history: "ประวัติ",
      generateCases_other: "สร้าง {{count}} Test Case",
      viewCases: "ดู Test Case",
      generatingCases_other:
        "กำลังเขียน Test Case สำหรับ {{count}} สถานการณ์… ปกติใช้เวลาไม่เกินประมาณ {{minutes}} นาที กรุณาเปิดหน้านี้ไว้",
      casesPartial:
        "บันทึก Test Case ของ {{done}} แล้ว ส่วนที่เหลือสร้างไม่สำเร็จ: {{message}} กดสร้างอีกครั้งสำหรับสถานการณ์ที่เหลือ",
      generatedCount_other: "สร้าง Test Case แล้ว {{count}} รายการ",
      lockedNote: "สถานการณ์ที่มี Test Case จะถูกล็อก",
      lockedCases_other: "{{count}} Test Case",
      lockedHint:
        "ถูกล็อกเพราะมี Test Case แล้ว หากต้องการเปลี่ยน ให้ลบสถานการณ์นี้ (Test Case จะถูกลบไปด้วย) แล้วเพิ่มใหม่",
      redraftLocked: "สถานการณ์ที่มี Test Case ร่างใหม่ไม่ได้ ใช้ สร้างเพิ่ม หรือ เพิ่มสถานการณ์ แทน",
      deletedWithCases_other: "ย้าย {{code}} และ Test Case {{count}} รายการไปที่รายการที่เพิ่งลบแล้ว กู้คืนได้ภายใน 7 วัน",
      confirmDeleteWithCases_other:
        "Test Case {{count}} รายการของสถานการณ์นี้จะถูกลบไปด้วย รวมถึงผลผ่าน/ไม่ผ่าน ทั้งหมดจะย้ายไปที่ ประวัติ → รายการที่เพิ่งลบ และกู้คืนได้ภายใน 7 วัน",
      scenarioCount_other: "{{count}} สถานการณ์",
      caseCount_other: "~{{count}} Test Case",
      estimatedCases_other: "~{{count}} Test Case",
      manual: "เพิ่มโดยคุณ",
      edit: "แก้ไข",
      delete: "ลบ",
      newScenario: "สถานการณ์ใหม่",
      generatingMore: "กำลังให้ AI สร้างสถานการณ์เพิ่ม… อาจใช้เวลาหนึ่งถึงสองนาที",
      restoring: "กำลังกู้คืน…",
      restored: "กู้คืนฉบับร่างก่อนหน้าแล้ว",
      deleted: "ย้าย {{code}} ไปที่รายการที่เพิ่งลบแล้ว กู้คืนได้ภายใน 7 วัน",
      openHistory: "เปิดประวัติ",
      confirmDeleteTitle: "ลบ {{code}} หรือไม่?",
      confirmDeleteText: "จะย้ายไปที่ ประวัติ → รายการที่เพิ่งลบ และกู้คืนได้ภายใน 7 วัน",
      confirmRedraftTitle: "ร่างสถานการณ์ใหม่ทั้งหมดหรือไม่?",
      confirmRestoreTitle: "กู้คืนฉบับร่างนี้หรือไม่?",
      confirmReplaceText:
        "สถานการณ์ปัจจุบันรวมถึงที่คุณแก้ไขจะถูกแทนที่ ฉบับร่างก่อนหน้ายังอยู่ในประวัติ",
    },

    scenarioForm: {
      title: "ชื่อ",
      description: "คำอธิบาย",
      technique: "เทคนิค",
      noTechnique: "ไม่ระบุเทคนิค",
      estimatedCases: "จำนวน Test Case โดยประมาณ",
      save: "บันทึก",
      saving: "กำลังบันทึก…",
    },

    scenarioHistory: {
      title: "ประวัติฉบับร่าง",
      description: "ฉบับร่างสถานการณ์ 10 ครั้งล่าสุด กู้คืนเพื่อนำสถานการณ์ชุดนั้นกลับมา",
      empty: "ยังไม่มีฉบับร่าง",
      latest: "(ล่าสุด)",
      count_other: "{{count}} สถานการณ์",
      restore: "กู้คืน",
      close: "ปิด",
      mode: {
        replace: "ร่าง",
        more: "สร้างเพิ่ม",
      },
      lockedNote: "เมื่อสถานการณ์มี Test Case แล้ว จะกู้คืนฉบับร่างก่อนหน้าไม่ได้ เพราะจะแทนที่สถานการณ์เหล่านั้น",
    },

    review: {
      title: {
        scenarios: "ร่างล่าสุดของ AI ต้องให้คุณตรวจสอบ",
        testCases: "Test Case ล่าสุดของ AI ต้องให้คุณตรวจสอบ",
      },
      text_other:
        "หลังจากลอง {{count}} ครั้ง การตรวจสอบของ AI ยังพบปัญหาเหล่านี้ คุณเป็นผู้ตัดสินใจ: แก้ไขเอง หรือทำเครื่องหมายว่าตรวจแล้ว",
      group: {
        scenarios: {
          coverage: "ยังไม่มีในสถานการณ์ของคุณ",
          technique: "ใช้เทคนิคไม่ถูกต้อง",
          other: "สิ่งอื่นที่ควรตรวจสอบ",
        },
        testCases: {
          coverage: "Test Case ยังไม่ครอบคลุม",
          technique: "ใช้เทคนิคไม่ถูกต้อง",
          other: "สิ่งอื่นที่ควรตรวจสอบ",
        },
      },
      addForIssue: "เพิ่มสถานการณ์สำหรับข้อนี้",
      hint: {
        scenarios: {
          technique: "แก้ไขสถานการณ์ที่ระบุในปัญหา หรือร่างใหม่",
          other: "แก้ไขหรือลบสถานการณ์ที่กล่าวถึง",
        },
        testCases: {
          coverage: "แก้ไข Test Case ของสถานการณ์นั้น หรือลบสถานการณ์แล้วเพิ่มใหม่",
          technique: "แก้ไข Test Case ที่ระบุในปัญหา",
          other: "แก้ไขหรือลบ Test Case ที่กล่าวถึง",
        },
      },
      markReviewed: "ทำเครื่องหมายว่าตรวจแล้ว",
      reminder: "สิ่งที่ต้องครอบคลุม:",
      notesTitle_other: "ข้อสังเกตจาก AI ที่ควรตรวจ ({{count}})",
      notesText: {
        scenarios: "การตรวจสอบของ AI ผ่านแล้ว แต่มีข้อสังเกตเหล่านี้ ควรดูสักครู่:",
        testCases: "การตรวจสอบของ AI ผ่านแล้ว แต่มีข้อสังเกตเหล่านี้ ควรดูก่อนเริ่มทดสอบ:",
      },
    },

    caseSync: {
      title: "Test Case อาจไม่ตรงกับสถานการณ์ล่าสุด",
      text_other: "มี {{count}} สถานการณ์ที่เพิ่มหลังจากสร้าง Test Case และยังไม่มี Test Case:",
      added: "{{code}} “{{title}}”",
      generate_other: "สร้าง {{count}} Test Case สำหรับสถานการณ์เหล่านี้",
    },

    testCasesStep: {
      title: "Test Case และการตรวจสอบ",
      summary_other: "{{count}} เคส · ผ่าน {{pass}} · ไม่ผ่าน {{fail}}",
      backToScenarios: "กลับไปที่สถานการณ์",
      next: "ถัดไป: สคริปต์ทดสอบ",
      markPassed: "ทำเครื่องหมาย {{code}} ว่าผ่าน",
      downloadTable: "ดาวน์โหลดตาราง Test Case",
      downloadReport: "ดาวน์โหลดรายงาน",
      exportNote: "ไฟล์ที่ส่งออกมีเฉพาะ Test Case ของข้อกำหนดนี้",
      empty: "ยังไม่มี Test Case กลับไปที่สถานการณ์เพื่อสร้าง",
      scenario: "{{title}}",
      statusOf: "สถานะของ {{code}}",
      reportTitle: "รายงานความครอบคลุมและการตรวจสอบย้อนกลับ",
      syncBanner_other: "มี {{count}} สถานการณ์ที่ยังไม่มี Test Case",
      syncReview: "ดูการเปลี่ยนแปลง",
      actionsFor: "การดำเนินการสำหรับ {{code}}",
      edit: "แก้ไข",
      delete: "ลบ",
      editTitle: "แก้ไข {{code}}",
      confirmDeleteTitle: "ลบ {{code}}?",
      confirmDeleteText:
        "จะย้ายไปที่ ประวัติ → รายการที่เพิ่งลบ และกู้คืนได้ภายใน 7 วัน เมื่อสถานการณ์ไม่มี Test Case เหลือ จะแก้ไขสถานการณ์นั้นได้อีกครั้ง",
      fields: {
        title: "ชื่อ",
        precondition: "เงื่อนไขก่อนทดสอบ",
        steps: "ขั้นตอน",
        stepsHint: "หนึ่งขั้นตอนต่อหนึ่งบรรทัด",
        expected: "ผลที่คาดหวัง",
      },
      save: "บันทึก",
      saving: "กำลังบันทึก…",
      errTitle: "กรุณาใส่ชื่อ",
      errSteps: "กรุณาใส่อย่างน้อยหนึ่งขั้นตอน",
      errExpected: "กรุณาใส่ผลที่คาดหวัง",
      columns: {
        id: "ID",
        title: "ชื่อ",
        precondition: "เงื่อนไขก่อนทดสอบ",
        steps: "ขั้นตอน",
        expected: "ผลลัพธ์ที่คาดหวัง",
        status: "สถานะ",
        actions: "การดำเนินการ",
      },
    },

    testCaseStatus: {
      OPEN: "รอทดสอบ",
      PASS: "ผ่าน",
      FAIL: "ไม่ผ่าน",
    },

    stepPlaceholder: {
      testScripts: "การสร้างสคริปต์ทดสอบอัตโนมัติจาก Test Case จะมาในอัปเดตถัดไป ขั้นตอนนี้ไม่บังคับ",
      back: "กลับไปที่ Test Case",
      skipToReport: "ข้ามไปที่รายงาน",
    },

    historyGenerated: {
      title: "สิ่งที่สร้างแล้ว",
      description: "ผลการสร้างสถานการณ์และกรณีทดสอบด้วย AI ที่เสร็จแล้ว เรียงจากล่าสุด เปิดเพื่อดูผลลัพธ์",
      filter: {
        all: "ทั้งหมด",
        scenarios: "สถานการณ์",
        testCases: "กรณีทดสอบ",
      },
      kind: {
        scenarios: "สถานการณ์",
        testCases: "กรณีทดสอบ",
      },
      scenarioCount_other: "{{count}} สถานการณ์",
      caseCount_other: "{{count}} กรณีทดสอบ",
      mode: {
        replace: "ร่าง",
        more: "สร้างเพิ่ม",
      },
      empty: "ยังไม่มีสิ่งที่สร้าง",
      open: "เปิด",
      showAll: "ดูทั้งหมด ({{count}})",
      showLess: "แสดงน้อยลง",
    },

    runStatus: {
      PASSED: "ผ่าน",
      NEEDS_REVIEW: "ต้องตรวจสอบ",
      FAILED: "ไม่สำเร็จ",
    },

    historyPage: {
      title: "ประวัติ",
    },

    recentlyDeleted: {
      title: "รายการที่เพิ่งลบ",
      description: "ข้อกำหนด สถานการณ์ และ Test Case ที่ลบจะเก็บไว้ที่นี่ 7 วัน หลังจากนั้นจะถูกลบถาวร",
      empty: "ไม่มีรายการ สิ่งที่คุณลบจะแสดงที่นี่เป็นเวลา 7 วัน",
      type: {
        requirement: "ข้อกำหนด",
        scenario: "สถานการณ์",
        testCase: "Test Case",
      },
      withTestCases_other: "+ Test Case {{count}} รายการ (กู้คืนพร้อมกัน)",
      inProject: "ใน {{project}}",
      inRequirement: "ใน “{{requirement}}” · {{project}}",
      deleted: "ลบเมื่อ {{time}}",
      daysLeft_other: "เหลือ {{count}} วัน",
      restore: "กู้คืน",
      working: "กำลังดำเนินการ…",
      deleteForever: "ลบถาวร",
      restored: "กู้คืนแล้ว",
      open: "เปิด",
      confirmTitle: "ลบถาวรหรือไม่?",
      confirmText: "“{{title}}” จะถูกลบถาวรและไม่สามารถกู้คืนได้",
    },

    comingSoon: {
      title: "เร็ว ๆ นี้",
      description: "หน้านี้กำลังอยู่ในระหว่างการออกแบบ",
    },

    project: {
      backToProjects: "กลับไปที่โปรเจกต์ทั้งหมด",
      loadError: "ไม่สามารถโหลดโปรเจกต์นี้ได้",
      createError: "ไม่สามารถสร้างโปรเจกต์ได้ กรุณาลองใหม่",
      createTitle: "สร้างโปรเจกต์ใหม่",
      createDescription:
        "สร้างโปรเจกต์เพื่อเริ่มสร้าง Test Case",
      projectName: "ชื่อโปรเจกต์",
      projectNamePlaceholder: "เช่น เว็บไซต์อีคอมเมิร์ซ",
      description: "คำอธิบาย",
      descriptionPlaceholder: "อธิบายรายละเอียดโปรเจกต์ของคุณ...",
      creating: "กำลังสร้าง...",
      createProject: "สร้างโปรเจกต์",
    },
  },
};

export default th;

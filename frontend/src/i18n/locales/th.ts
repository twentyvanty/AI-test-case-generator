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
      hint: "PDF, DOCX, Markdown หรือ TXT — ไม่เกิน 20 MB ต่อไฟล์ ครั้งละ 5 ไฟล์",
      tooLarge: "{{name}} มีขนาดเกิน 20 MB",
      unsupported: "{{name}} ไม่ใช่ไฟล์ PDF, DOCX, Markdown หรือ TXT",
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
        "{{code}} รวมถึงสถานการณ์ Test Case และประวัติการสร้างทั้งหมดจะถูกลบ และไม่สามารถกู้คืนได้",
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
    },

    specificationFiles: {
      reading: "กำลังอ่าน {{name}}…",
      remove: "ลบ {{name}}",
      noText: "ไม่พบข้อความใน {{name}} หากเป็นไฟล์ภาพสแกน กรุณาพิมพ์ข้อกำหนดแทน",
      hint: "ข้อความของแต่ละไฟล์จะถูกเพิ่มลงในรายละเอียดด้านบน เพื่อให้คุณตรวจสอบและแก้ไขสิ่งที่ AI จะอ่านได้",
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

    scenarioPreview: {
      title: "สถานการณ์ที่ร่างไว้",
      count_other: "{{count}} สถานการณ์",
      note: "การแก้ไข เลือก และเพิ่มสถานการณ์จะมาในอัปเดตถัดไป",
      noTechnique: "ไม่ระบุเทคนิค",
      estimatedCases_other: "~{{count}} Test Case",
      needsReviewTitle: "กรุณาตรวจสอบสถานการณ์เหล่านี้",
      needsReviewText: "การตรวจสอบของ AI ยังพบปัญหาหลังจากลอง 3 ครั้ง กรุณาตรวจสอบสถานการณ์ด้านล่างอย่างละเอียด:",
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

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
      aiChoose: "ให้ AI เลือก",
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
      add: "เพิ่มข้อกำหนด",
      text: "รายละเอียดข้อกำหนด",
      textPlaceholder: "เช่น ผู้ใช้ต้องสามารถรีเซ็ตรหัสผ่านผ่านลิงก์ทางอีเมลได้…",
      empty: "ยังไม่มีข้อกำหนด เพิ่มข้อกำหนดเพื่อเริ่มสร้าง Test Case",
      caseCount_other: "{{count}} เคส",
      coverage: "ครอบคลุม {{percent}}%",
      open: "เปิดข้อกำหนด",
    },

    coverage: {
      title: "ความครอบคลุมและการติดตาม",
      reportTitle: "รายงานความครอบคลุมและการติดตาม",
      empty: "ยังไม่มี Test Case",
      failingCases: "เคสที่ไม่ผ่าน",
      mappedCases: "เคสที่เชื่อมโยงแล้ว",
    },

    dropzone: {
      title: "วางไฟล์ข้อกำหนดที่นี่",
      hint: "PDF, DOCX, Markdown — ไม่เกิน 20 MB",
      remove: "ลบไฟล์",
      tooLarge: "ไฟล์มีขนาดเกิน 20 MB",
    },

    requirementPage: {
      backToProject: "กลับไปที่โปรเจกต์",
      notFound: "ไม่พบข้อกำหนดนี้",
    },

    requirementStatus: {
      success: "สำเร็จ",
      notGenerated: "ยังไม่ได้สร้าง",
      generating: "กำลังสร้าง…",
    },

    steps: {
      setup: "ตั้งค่า",
      review: "ตรวจสอบสถานการณ์",
      validate: "ยืนยันผลและรายงาน",
    },

    setup: {
      hint: "เลือกเทคนิคและโมดูล AI ก่อนสร้าง Test Case",
      technique: "เทคนิค",
      aiModule: "โมดูล AI",
      generate: "สร้าง Test Case",
      generating: "กำลังสร้าง…",
    },

    aiModules: {
      local: {
        name: "Qwen 3 (ในเครื่อง)",
        description: "ทำงานบนเครื่องของคุณ ข้อมูลไม่ถูกส่งออก",
      },
      cloud: {
        name: "โมเดลบนคลาวด์",
        description: "ครอบคลุมดีที่สุดสำหรับข้อกำหนดยาว",
      },
      auto: {
        name: "เลือกอัตโนมัติ",
        description: "เลือกโมดูลตามขนาดของข้อกำหนด",
      },
    },

    review: {
      title: "ตรวจสอบสถานการณ์ที่สร้างขึ้น",
      description:
        "ตรวจสอบสถานการณ์และจำนวนเคส สร้างเพิ่ม แก้ไข หรือลบ ก่อนยืนยันผล",
      addScenario: "เพิ่มสถานการณ์",
      generateMore: "สร้างเพิ่ม",
      continue: "ไปยืนยันผล",
      scenarioCount_other: "{{count}} สถานการณ์",
      edit: "แก้ไข",
      addCase: "เพิ่มเคส",
      delete: "ลบ",
      newScenario: "สถานการณ์ใหม่",
      newCase: "Test Case ใหม่",
      confirmDeleteScenario: 'ลบสถานการณ์ "{{title}}" และ Test Case ทั้งหมดในนั้นหรือไม่?',
    },

    validate: {
      title: "Test Case และการยืนยันผล",
      passCount_other: "ผ่าน {{count}}",
      failCount_other: "ไม่ผ่าน {{count}}",
      backToScenarios: "กลับไปที่สถานการณ์",
      downloadTable: "ดาวน์โหลดตาราง Test Case",
      downloadReport: "ดาวน์โหลดรายงาน",
      exportNote: "ไฟล์ที่ส่งออกมีเฉพาะ Test Case ของข้อกำหนดนี้",
      scenarioLabel: "สถานการณ์: {{title}}",
      markPassed: "ทำเครื่องหมายว่า {{id}} ผ่าน",
      columns: {
        id: "รหัส",
        title: "ชื่อ",
        precondition: "เงื่อนไขก่อนทดสอบ",
        steps: "ขั้นตอน",
        expected: "ผลลัพธ์ที่คาดหวัง",
        status: "สถานะ",
      },
    },

    testStatus: {
      pass: "ผ่าน",
      fail: "ไม่ผ่าน",
      open: "ยังไม่ทดสอบ",
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


(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  // 안전하게 현재 페이지의 MBTI 유형을 확인
  function getValidMBTI(value) {
    const valid = /^[EI][SN][TF][JP]$/;
    return typeof value === "string" && valid.test(value)
      ? value
      : null;
  }

  // --------------------------------------------------
  // 테스트 페이지
  // --------------------------------------------------
  function initQuiz() {
    const quiz = $("#quiz");
    if (!quiz || typeof QUESTIONS === "undefined") return;

    const answers = new Array(QUESTIONS.length).fill(null);
    let current = 0;

    const title = $("#question-title");
    const answerA = $("#answer-a");
    const answerB = $("#answer-b");
    const textA = $("#answer-text-a");
    const textB = $("#answer-text-b");
    const prev = $("#prev-btn");
    const next = $("#next-btn");
    const message = $("#quiz-message");

    function renderQuestion() {
      const q = QUESTIONS[current];

      title.textContent = q.title;
      textA.textContent = q.a;
      textB.textContent = q.b;

      $("#question-number").textContent =
        `QUESTION ${String(current + 1).padStart(2, "0")} / ${QUESTIONS.length}`;

      const progress = Math.round(
        ((current + 1) / QUESTIONS.length) * 100
      );

      $("#progress-percent").textContent = `${progress}%`;
      $("#progress-bar").style.width = `${progress}%`;

      $("#answered-count").textContent =
        `${answers.filter(a => a !== null).length} / ${QUESTIONS.length} 응답`;

      prev.disabled = current === 0;
      next.textContent =
        current === QUESTIONS.length - 1 ? "결과 보기 →" : "다음 →";

      answerA.classList.toggle("selected", answers[current] === "a");
      answerB.classList.toggle("selected", answers[current] === "b");

      message.textContent = "";
    }

    function selectAnswer(value) {
      answers[current] = value;
      renderQuestion();

      // 선택 직후 자동으로 다음 문항으로 이동
      if (current < QUESTIONS.length - 1) {
        current++;
        renderQuestion();
      }
    }

    answerA.addEventListener("click", () => selectAnswer("a"));
    answerB.addEventListener("click", () => selectAnswer("b"));

    prev.addEventListener("click", () => {
      if (current > 0) {
        current--;
        renderQuestion();
      }
    });

    next.addEventListener("click", () => {
      if (answers[current] === null) {
        message.textContent = "먼저 답변을 선택해 주세요!";
        return;
      }

      if (current < QUESTIONS.length - 1) {
        current++;
        renderQuestion();
        return;
      }

      const missing = answers.findIndex(a => a === null);

      if (missing !== -1) {
        current = missing;
        renderQuestion();
        message.textContent = "모든 질문에 답해 주세요.";
        return;
      }

      const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

      QUESTIONS.forEach((q, i) => {
        const letter = q.axis === "EI"
          ? (answers[i] === "a" ? "E" : "I")
          : q.axis === "SN"
          ? (answers[i] === "a" ? "S" : "N")
          : q.axis === "TF"
          ? (answers[i] === "a" ? "T" : "F")
          : (answers[i] === "a" ? "J" : "P");

        scores[letter]++;
      });

      const mbti =
        (scores.E >= scores.I ? "E" : "I") +
        (scores.S >= scores.N ? "S" : "N") +
        (scores.T >= scores.F ? "T" : "F") +
        (scores.J >= scores.P ? "J" : "P");

      // 결과는 URL에 기록해 공유 가능하게 한다.
      window.location.href =
        `result.html?mbti=${encodeURIComponent(mbti)}`;
    });

    renderQuestion();
  }

  // --------------------------------------------------
  // 결과 페이지
  // --------------------------------------------------
  function initResult() {
    const container = $("#result-container");
    if (!container || typeof DOGS === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const mbti = getValidMBTI(params.get("mbti"));

    if (!mbti || !DOGS[mbti]) {
      container.innerHTML = `
        <section class="empty-result">
          <div class="empty-emoji">🐾</div>
          <h1>아직 결과가 없어요!</h1>
          <p>테스트를 완료하고 나와 잘 맞는 강아지를 찾아보세요.</p>
          <a class="btn btn-primary btn-large" href="test.html">
            테스트 시작하기 →
          </a>
        </section>
      `;
      return;
    }

    const dog = DOGS[mbti];
    document.title = `${mbti} - ${dog.breed} | 댕BTI`;

    const safe = (value) => String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

    container.innerHTML = `
      <section class="result-card">
        <div class="result-top">
          <p class="eyebrow">YOUR DOG MBTI MATCH</p>
          <div class="result-mbti">${safe(mbti)}</div>
          <h1>당신과 찰떡궁합인<br>
            <span>${safe(dog.breed)}</span>
          </h1>
          <p class="result-tagline">${safe(dog.tagline)}</p>
        </div>

        <div class="dog-photo-wrap">
          <img
            class="dog-photo"
            src="${safe(dog.image)}"
            alt="${safe(dog.breed)} 강아지 사진"
          >
          <div class="photo-fallback" hidden>
            <span>${safe(dog.emoji)}</span>
            <p>강아지 사진을 불러오지 못했어요.</p>
          </div>
        </div>

        <div class="result-body">
          <div class="match-label">🐾 YOUR SOULMATE</div>
          <h2>${safe(dog.breed)}와 당신이 잘 어울리는 이유</h2>
          <p class="reason-text">${safe(dog.reason)}</p>

          <h3>우리의 케미 키워드</h3>
          <div class="trait-list">
            ${dog.traits.map(trait =>
              `<span class="trait-chip">#${safe(trait)}</span>`
            ).join("")}
          </div>

          <div class="disclaimer">
            💡 이 결과는 재미를 위한 성격 매칭입니다.
            실제 강아지의 성격과 행동은 개체, 사회화 경험,
            환경 및 훈련에 따라 달라질 수 있어요.
          </div>

          <div class="result-actions">
            <button class="btn btn-primary btn-large" id="copy-btn" type="button">
              🔗 결과 URL 복사하기
            </button>
            <button class="btn btn-outline btn-large" id="share-btn" type="button">
              📤 결과 공유하기
            </button>
            <a class="btn btn-outline btn-large" href="test.html">
              🔄 다시 테스트하기
            </a>
          </div>

          <p class="form-message" id="share-message" role="status"></p>
        </div>
      </section>
    `;

    const image = container.querySelector(".dog-photo");
    const fallback = container.querySelector(".photo-fallback");

    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    });

    const copyBtn = $("#copy-btn");
    const shareBtn = $("#share-btn");
    const shareMessage = $("#share-message");

    // 현재 페이지 주소의 mbti 파라미터만으로 결과 재현 가능
    const shareURL = new URL("result.html", window.location.href);
    shareURL.searchParams.set("mbti", mbti);
    const shareURLText = shareURL.href;

    async function copyURL() {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareURLText);
        } else {
          // 구형 브라우저를 위한 복사 대체 처리
          const textarea = document.createElement("textarea");
          textarea.value = shareURLText;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();

          const copied = document.execCommand("copy");
          textarea.remove();

          if (!copied) throw new Error("복사 실패");
        }

        shareMessage.textContent = "결과 URL이 클립보드에 복사되었어요! 🎉";
      } catch (error) {
        shareMessage.textContent =
          "자동 복사가 안 되었어요. 아래 주소를 직접 복사해 주세요.";

        const link = document.createElement("a");
        link.href = shareURLText;
        link.textContent = shareURLText;
        link.className = "share-url";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        shareMessage.appendChild(document.createElement("br"));
        shareMessage.appendChild(link);
      }
    }

    copyBtn.addEventListener("click", copyURL);

    shareBtn.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${mbti} - ${dog.breed} | 댕BTI`,
            text: `나와 잘 맞는 강아지는 ${dog.breed}! 너도 댕BTI 테스트해 봐 🐶`,
            url: shareURLText
          });
        } catch (error) {
          // 사용자가 공유 창을 닫은 경우에는 별도 오류를 표시하지 않는다.
          if (error.name !== "AbortError") {
            await copyURL();
          }
        }
      } else {
        await copyURL();
      }
    });
  }

  initQuiz();
  initResult();
})();

document.addEventListener("DOMContentLoaded", () => {
    const simulatorConfig = {
        vehicle: { min: 15000000, max: 250000000, step: 1000000, value: 50000000 },
        downPayment: { min: 0, max: 80, step: 1, value: 12 },
        term: { min: 12, max: 72, step: 12, value: 36 },
        rate: { min: 0.99, max: 2.09, step: 0.01, value: 1.39 }
    };

    const simulatorElements = {
        vehicle: document.getElementById("sim-vehicle"),
        downPayment: document.getElementById("sim-down-payment"),
        term: document.getElementById("sim-term"),
        rate: document.getElementById("sim-rate"),
        vehicleOutput: document.getElementById("vehicle-output"),
        downPaymentOutput: document.getElementById("down-payment-output"),
        downPaymentAmount: document.getElementById("down-payment-amount"),
        termOutput: document.getElementById("term-output"),
        rateOutput: document.getElementById("rate-output"),
        annualRateOutput: document.getElementById("annual-rate-output"),
        paymentOutput: document.getElementById("payment-output")
    };

    const currencyFormatter = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });

    function configureSimulator() {
        const fields = [
            [simulatorElements.vehicle, simulatorConfig.vehicle],
            [simulatorElements.downPayment, simulatorConfig.downPayment],
            [simulatorElements.term, simulatorConfig.term],
            [simulatorElements.rate, simulatorConfig.rate]
        ];

        fields.forEach(([element, config]) => {
            if (!element) return;
            Object.assign(element, config);
            element.addEventListener("input", updateSimulator);
        });

        if (simulatorElements.vehicle) updateSimulator();
    }

    function updateSliderFill(slider) {
        const value = Number(slider.value);
        const minimum = Number(slider.min);
        const maximum = Number(slider.max);
        const percentage = ((value - minimum) / (maximum - minimum)) * 100;

        slider.style.background =
            `linear-gradient(to right, var(--navy) ${percentage}%, var(--border) ${percentage}%)`;
    }

    function updateSimulator() {
        const vehicleValue = Number(simulatorElements.vehicle.value);
        const downPaymentPercentage = Number(simulatorElements.downPayment.value);
        const termMonths = Number(simulatorElements.term.value);
        const monthlyRatePercentage = Number(simulatorElements.rate.value);
        const downPaymentAmount = vehicleValue * (downPaymentPercentage / 100);
        const financedAmount = vehicleValue - downPaymentAmount;
        const monthlyRate = monthlyRatePercentage / 100;
        const annualEffectiveRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
        const factor = Math.pow(1 + monthlyRate, termMonths);
        const monthlyPayment = monthlyRate === 0
            ? financedAmount / termMonths
            : financedAmount * (monthlyRate * factor) / (factor - 1);

        simulatorElements.vehicleOutput.textContent = currencyFormatter.format(vehicleValue);
        simulatorElements.downPaymentOutput.textContent = `${downPaymentPercentage}%`;
        simulatorElements.downPaymentAmount.textContent = currencyFormatter.format(downPaymentAmount);
        simulatorElements.termOutput.textContent = `${termMonths} meses`;
        simulatorElements.rateOutput.textContent = `${monthlyRatePercentage.toFixed(2)}%`;
        simulatorElements.annualRateOutput.textContent = `${annualEffectiveRate.toFixed(2)}%`;
        simulatorElements.paymentOutput.textContent = currencyFormatter.format(monthlyPayment);

        [
            simulatorElements.vehicle,
            simulatorElements.downPayment,
            simulatorElements.term,
            simulatorElements.rate
        ].forEach(updateSliderFill);
    }

    const creditForm = document.getElementById("credit-form");
    if (!creditForm) {
        configureSimulator();
        return;
    }

    const stepOne = document.getElementById("form-step-1");
    const stepTwo = document.getElementById("form-step-2");
    const rejectionStep = document.getElementById("rejection-step");
    const progressItems = [...document.querySelectorAll(".progress-item")];
    const formErrorOne = document.getElementById("form-error-1");
    const formErrorTwo = document.getElementById("form-error-2");
    const motorcycleQuestion = document.getElementById("motorcycle-question");
    const vehicleAgeQuestion = document.getElementById("vehicle-age-question");
    const debtClearanceQuestion = document.getElementById("debt-clearance-question");
    const nextButton = document.getElementById("next-button");
    const previousButton = document.getElementById("previous-button");
    const submitButton = document.getElementById("submit-button");
    const retryButton = document.getElementById("retry-button");
    const dialog = document.getElementById("confirmation-dialog");
    const closeDialogButton = document.getElementById("close-dialog");
    const cancelDialogButton = document.getElementById("cancel-dialog");
    const confirmCodeButton = document.getElementById("confirm-code");
    const codeInputs = [...document.querySelectorAll(".code-digit")];
    const codeContainer = document.querySelector(".code-inputs");
    const codeError = document.getElementById("code-error");

    function getSelectedValue(name) {
        return creditForm.querySelector(`input[name="${name}"]:checked`)?.value || "";
    }

    function setConditionalQuestion(element, visible) {
        element.hidden = !visible;
        element.querySelectorAll("input").forEach((input) => {
            input.disabled = !visible;
            if (!visible) input.checked = false;
        });
        element.classList.remove("has-error");
    }

    function syncConditionalQuestions() {
        const vehicle = getSelectedValue("vehicle");
        const creditReport = getSelectedValue("credit_report");

        setConditionalQuestion(motorcycleQuestion, vehicle === "motorcycle");
        setConditionalQuestion(vehicleAgeQuestion, vehicle === "private");
        setConditionalQuestion(debtClearanceQuestion, creditReport === "yes");
    }

    function clearStepErrors(step) {
        step.querySelectorAll(".has-error").forEach((element) => {
            element.classList.remove("has-error");
        });

        step.querySelectorAll("[aria-invalid='true']").forEach((element) => {
            element.removeAttribute("aria-invalid");
        });
    }

    function markRadioGroup(name) {
        const fieldset = creditForm.querySelector(`[data-field="${name}"]`);
        fieldset?.classList.add("has-error");
        fieldset?.querySelector("input:not(:disabled)")?.setAttribute("aria-invalid", "true");
        return fieldset;
    }

    function validateStepOne() {
        clearStepErrors(stepOne);
        const requirements = [
            ["vehicle", Boolean(getSelectedValue("vehicle"))],
            ["income", Boolean(getSelectedValue("income"))],
            ["credit_report", Boolean(getSelectedValue("credit_report"))]
        ];

        const vehicle = getSelectedValue("vehicle");
        const creditReport = getSelectedValue("credit_report");

        if (vehicle === "motorcycle") {
            requirements.push(["motorcycle_value", Boolean(getSelectedValue("motorcycle_value"))]);
        }

        if (vehicle === "private") {
            requirements.push(["vehicle_age", Boolean(getSelectedValue("vehicle_age"))]);
        }

        if (creditReport === "yes") {
            requirements.push(["debt_clearance", Boolean(getSelectedValue("debt_clearance"))]);
        }

        const invalidGroups = requirements
            .filter(([, isValid]) => !isValid)
            .map(([name]) => markRadioGroup(name));

        formErrorOne.hidden = invalidGroups.length === 0;
        invalidGroups[0]?.querySelector("input:not(:disabled)")?.focus();
        return invalidGroups.length === 0;
    }

    function doesNotQualify() {
        const vehicle = getSelectedValue("vehicle");

        return getSelectedValue("income") === "no"
            || (getSelectedValue("credit_report") === "yes"
                && getSelectedValue("debt_clearance") === "no")
            || (vehicle === "motorcycle" && getSelectedValue("motorcycle_value") === "no")
            || (vehicle === "private" && getSelectedValue("vehicle_age") === "no");
    }

    function showFormSection(sectionName) {
        const sections = {
            one: stepOne,
            two: stepTwo,
            rejection: rejectionStep
        };

        Object.entries(sections).forEach(([name, element]) => {
            element.hidden = name !== sectionName;
        });

        progressItems.forEach((item, index) => {
            item.classList.toggle("is-active", sectionName === (index === 0 ? "one" : "two"));
            item.classList.toggle("is-complete", sectionName === "two" && index === 0);
        });

        document.querySelector(".application-card")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start"
        });
    }

    function validateTextField(input, validator) {
        const fieldGroup = input.closest(".field-group");
        const valid = validator(input.value.trim());

        fieldGroup.classList.toggle("has-error", !valid);
        input.classList.toggle("is-valid", valid);
        if (valid) {
            input.removeAttribute("aria-invalid");
        } else {
            input.setAttribute("aria-invalid", "true");
        }
        return valid;
    }

    const namePattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{2,40}$/;
    const phonePattern = /^3\d{9}$/;
    const isValidName = (value) => {
        const letters = value.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || [];
        return namePattern.test(value) && letters.length >= 2;
    };

    function validateStepTwo() {
        clearStepErrors(stepTwo);

        const name = document.getElementById("first-name");
        const surname = document.getElementById("last-name");
        const phone = document.getElementById("phone");
        const email = document.getElementById("email");

        const checks = [
            [name, validateTextField(name, isValidName)],
            [surname, validateTextField(surname, isValidName)],
            [phone, validateTextField(phone, (value) => phonePattern.test(value))],
            [email, validateTextField(email, () => email.validity.valid)]
        ];

        const purchaseValid = Boolean(getSelectedValue("purchase_status"));
        if (!purchaseValid) markRadioGroup("purchase_status");

        const firstInvalid = checks.find(([, valid]) => !valid)?.[0]
            || creditForm.querySelector("[data-field='purchase_status'].has-error input");

        formErrorTwo.hidden = !firstInvalid;
        firstInvalid?.focus();
        return !firstInvalid;
    }

    function resetCodeDialog() {
        codeInputs.forEach((input) => {
            input.value = "";
        });
        codeContainer.classList.remove("has-error");
        codeError.hidden = true;
    }

    function openCodeDialog() {
        resetCodeDialog();
        dialog.showModal();
        codeInputs[0]?.focus();
    }

    function closeCodeDialog() {
        dialog.close();
        submitButton.focus();
    }

    creditForm.querySelectorAll("input[name='vehicle'], input[name='credit_report']")
        .forEach((input) => input.addEventListener("change", syncConditionalQuestions));

    nextButton.addEventListener("click", () => {
        if (!validateStepOne()) return;
        showFormSection(doesNotQualify() ? "rejection" : "two");
    });

    previousButton.addEventListener("click", () => showFormSection("one"));

    submitButton.addEventListener("click", () => {
        if (validateStepTwo()) openCodeDialog();
    });

    creditForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!stepTwo.hidden) {
            submitButton.click();
        } else if (!stepOne.hidden) {
            nextButton.click();
        }
    });

    retryButton.addEventListener("click", () => {
        creditForm.reset();
        creditForm.querySelectorAll(".is-valid").forEach((input) => {
            input.classList.remove("is-valid");
        });
        clearStepErrors(creditForm);
        syncConditionalQuestions();
        showFormSection("one");
    });

    closeDialogButton.addEventListener("click", closeCodeDialog);
    cancelDialogButton.addEventListener("click", closeCodeDialog);

    dialog.addEventListener("click", (event) => {
        const dialogBounds = dialog.getBoundingClientRect();
        const clickedOutside = event.clientX < dialogBounds.left
            || event.clientX > dialogBounds.right
            || event.clientY < dialogBounds.top
            || event.clientY > dialogBounds.bottom;

        if (clickedOutside) closeCodeDialog();
    });

    codeInputs.forEach((input, index) => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, 1);
            codeContainer.classList.remove("has-error");
            codeError.hidden = true;
            if (input.value) codeInputs[index + 1]?.focus();
        });

        input.addEventListener("keydown", (event) => {
            if (event.key === "Backspace" && !input.value) {
                codeInputs[index - 1]?.focus();
            }

            if (event.key === "Enter") {
                confirmCodeButton.click();
            }
        });

        input.addEventListener("paste", (event) => {
            event.preventDefault();
            const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);

            digits.split("").forEach((digit, digitIndex) => {
                codeInputs[digitIndex].value = digit;
            });

            codeInputs[Math.min(digits.length, codeInputs.length - 1)]?.focus();
        });
    });

    confirmCodeButton.addEventListener("click", () => {
        const code = codeInputs.map((input) => input.value).join("");

        if (!/^\d{4}$/.test(code)) {
            codeContainer.classList.add("has-error");
            codeError.hidden = false;
            codeInputs.find((input) => !input.value)?.focus();
            return;
        }

        window.location.assign("confirmacion.html");
    });

    ["first-name", "last-name", "phone"].forEach((id) => {
        const input = document.getElementById(id);
        input.addEventListener("input", () => {
            if (id === "phone") {
                input.value = input.value.replace(/\D/g, "").slice(0, 10);
            } else {
                input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]/g, "");
            }
        });
    });

    configureSimulator();
    syncConditionalQuestions();
});

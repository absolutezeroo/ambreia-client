import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ISelectorWindow} from '@core/window/components/ISelectorWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import {Logger} from '@core/utils/Logger';
import {PollQuestion} from '@habbo/communication/messages/parser/poll/PollQuestion';
import {RoomWidgetPollMessage} from '../messages/RoomWidgetPollMessage';
import type {IPollDialog} from './IPollDialog';
import type {PollWidget} from './PollWidget';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.ui.widget.poll.PollContentDialog');

/**
 * The questionnaire itself: one question at a time, in one window that is rebuilt in place.
 *
 * `nextQuestion()` is the whole loop — it renders the current question, and when there are none
 * left it tells the widget the poll is finished. Each answer is sent as its own message rather
 * than batched at the end, so abandoning halfway still leaves the answers given.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as
 */
export class PollContentDialog implements IPollDialog
{
    // AS3: .../widget/poll/PollContentDialog.as::STATE_FLAG_SELECTED
    // Name DERIVED: AS3 calls `testStateFlag(8)` inline. 8 is the selected bit — it is what
    // decides whether a checkbox row counts as an answer.
    private static readonly STATE_FLAG_SELECTED: number = 8;

    // AS3: .../widget/poll/PollContentDialog.as::_id
    private _id: number = -1;

    // AS3: .../widget/poll/PollContentDialog.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../widget/poll/PollContentDialog.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../widget/poll/PollContentDialog.as::_widget
    private _widget: PollWidget | null;

    // AS3: .../widget/poll/PollContentDialog.as::_cancelConfirmWindow
    private _cancelConfirmWindow: IWindowContainer | null = null;

    // AS3: .../widget/poll/PollContentDialog.as::_started
    // Name DERIVED (`_SafeStr_9908`): guards `start()` so a second call cannot skip a question.
    private _started: boolean = false;

    // AS3: .../widget/poll/PollContentDialog.as::_questions
    private _questions: PollQuestion[] | null;

    // AS3: .../widget/poll/PollContentDialog.as::_questionIndex
    // Name DERIVED (`_SafeStr_5003`): the cursor into the top-level question array. Starts at -1
    // because `getNextQuestion()` increments before reading.
    private _questionIndex: number = -1;

    // AS3: .../widget/poll/PollContentDialog.as::_answerableQuestionCount
    // Name DERIVED (`_SafeStr_7338`): shown as "%count%", and it counts every parent that *has*
    // follow-ups as one extra — so an NPS poll advertises the worst case, not the actual length.
    private _answerableQuestionCount: number = 0;

    // AS3: .../widget/poll/PollContentDialog.as::_parentQuestionIndex
    // Name DERIVED (`_SafeStr_7167`): the parent whose children are eligible next. Set to the
    // index just served and cleared to -1 once a child has been taken from it.
    private _parentQuestionIndex: number = -1;

    // AS3: .../widget/poll/PollContentDialog.as::_npsPoll
    private _npsPoll: boolean = false;

    // AS3: .../widget/poll/PollContentDialog.as::_pendingChoiceType
    // Name DERIVED (`_SafeStr_6258`): the `choiceType` of the radio answer just given, which is
    // what selects the follow-up question. Only ever non-zero in an NPS poll.
    private _pendingChoiceType: number = 0;

    // AS3: .../widget/poll/PollContentDialog.as::_currentQuestion
    private _currentQuestion: PollQuestion | null = null;

    // AS3: .../widget/poll/PollContentDialog.as::PollContentDialog()
    constructor(id: number, startMessage: string, questions: PollQuestion[] | null, widget: PollWidget, npsPoll: boolean)
    {
        this._id = id;
        this._questions = questions;
        this._widget = widget;
        this._npsPoll = npsPoll;

        this.answerableQuestionCount();

        this._window = widget.windowManager.buildWidgetLayout('poll_question') as IWindowContainer | null;

        if(this._window === null || this._window === undefined)
        {
            log.warn('poll_question did not build — the survey cannot be answered');
            this._window = null;

            return;
        }

        const headline = this._window.findChildByName('poll_question_headline') as ITextWindow | null;

        if(headline !== null && headline !== undefined) headline.text = startMessage;

        this._window.center();

        this.bind(this._window, 'header_button_close', this.onClose);
        this.bind(this._window, 'poll_question_button_ok', this.onOk);
        this.bind(this._window, 'poll_question_cancel', this.onCancel);
    }

    // AS3: .../widget/poll/PollContentDialog.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../widget/poll/PollContentDialog.as::start()
    // Guarded, so calling it twice does not consume two questions.
    start(): void
    {
        if(this._started) return;

        this._started = true;

        this.nextQuestion();
    }

    // AS3: .../widget/poll/PollContentDialog.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._cancelConfirmWindow !== null)
        {
            this._cancelConfirmWindow.dispose();
            this._cancelConfirmWindow = null;
        }

        this._widget = null;
        this._questions = null;
    }

    // AS3: .../widget/poll/PollContentDialog.as::PollContentDialog()
    private bind(window: IWindowContainer, name: string, handler: () => void): void
    {
        const button = window.findChildByName(name) ?? null;

        if(button !== null) button.addEventListener(WindowMouseEvent.CLICK, handler);
    }

    // AS3: .../widget/poll/PollContentDialog.as::onClose()
    private onClose = (): void =>
    {
        this.showCancelConfirm();
    };

    // AS3: .../widget/poll/PollContentDialog.as::onOk()
    private onOk = (): void =>
    {
        this.answerPollQuestion();
    };

    // AS3: .../widget/poll/PollContentDialog.as::onCancel()
    // Cancelling and closing are the same thing: both raise the confirmation.
    private onCancel = (): void =>
    {
        this.showCancelConfirm();
    };

    /**
     * Renders whatever `getNextQuestion()` hands back, or finishes the poll when it hands back
     * nothing. The answer container is emptied by disposing child 0 repeatedly — the list
     * re-indexes as it shrinks.
     *
     * The default branch of the type switch **recurses**: an unknown question type is skipped
     * rather than rendered, which is the only place a question is silently dropped.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::nextQuestion()
    private nextQuestion(): void
    {
        this._currentQuestion = this.getNextQuestion();

        if(this._currentQuestion === null)
        {
            this._widget?.pollFinished(this._id);

            return;
        }

        if(this._window === null) return;

        const questionText = this._window.findChildByName('poll_question_text') as ITextWindow | null;

        if(questionText !== null && questionText !== undefined) questionText.text = this._currentQuestion.questionText;

        const questionNumber = this._window.findChildByName('poll_question_number') as ITextWindow | null;

        if(questionNumber !== null && questionNumber !== undefined)
        {
            // AS3 writes the key in, reads it straight back out — so what is substituted is the
            // *localised* string, not the key. The two placeholders are filled by hand rather
            // than through registerParameter.
            questionNumber.text = '${poll_question_number}';
            questionNumber.text = questionNumber.text
                .replace('%number%', String(this._questionIndex + 1))
                .replace('%count%', String(this._answerableQuestionCount));
        }

        const container = this._window.findChildByName('poll_question_answer_container') as IWindowContainer | null;

        if(container !== null && container !== undefined)
        {
            while(container.numChildren > 0)
            {
                container.getChildAt(0)?.dispose();
            }

            container.invalidate();
        }

        switch(this._currentQuestion.questionType)
        {
            case PollQuestion.QUESTION_TYPE_RADIO:
                this.populateRadioButtonType(container, this._currentQuestion);
                break;

            case PollQuestion.QUESTION_TYPE_CHECKBOX:
                this.populateCheckBoxType(container, this._currentQuestion);
                break;

            case PollQuestion.QUESTION_TYPE_TEXT:
                this.populateTextLineType(container);
                break;

            // AS3 switches on `questionType - 1`, so its four cases are 0-3 for types 1-4. Type 4
            // is the text *area*, whose populate method just calls the text-line one.
            case PollQuestion.QUESTION_TYPE_TEXT + 1:
                this.populateTextAreaType(container);
                break;

            default:
                this.nextQuestion();

                return;
        }

        const wrapper = this._window.findChildByName('poll_content_wrapper') as IItemListWindow | null;

        if(wrapper !== null && wrapper !== undefined)
        {
            this._window.height += wrapper.scrollableRegion.height - wrapper.visibleRegion.height;
            this._window.center();
        }
    }

    /**
     * The NPS branch first: if the last answer set a `choiceType`, look through the children of
     * the question just served for one whose `questionCategory` matches, and serve that instead
     * of advancing. Clearing `_parentQuestionIndex` is what stops a parent yielding twice.
     *
     * Otherwise advance the top-level cursor, remember the new index as the potential parent, and
     * return that question — or null when the array is exhausted.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::getNextQuestion()
    private getNextQuestion(): PollQuestion | null
    {
        const questions = this._questions;

        if(questions === null) return null;

        if(this._npsPoll && this._parentQuestionIndex >= 0 && this._pendingChoiceType !== 0)
        {
            const parent = questions[this._parentQuestionIndex];

            for(const child of parent?.children ?? [])
            {
                if(child && child.questionCategory === this._pendingChoiceType)
                {
                    this._parentQuestionIndex = -1;

                    return child;
                }
            }
        }

        this._questionIndex = this._questionIndex + 1;

        if(this._questionIndex < questions.length)
        {
            this._parentQuestionIndex = this._questionIndex;

            return questions[this._questionIndex] ?? null;
        }

        return null;
    }

    // AS3: .../widget/poll/PollContentDialog.as::populateRadionButtonType()
    // AS3's spelling ("Radion") is not carried over; everything else is.
    private populateRadioButtonType(container: IWindowContainer | null, question: PollQuestion): void
    {
        this.populateSelectionType(container, question, 'poll_answer_radiobutton_input');
    }

    // AS3: .../widget/poll/PollContentDialog.as::populateCheckBoxType()
    private populateCheckBoxType(container: IWindowContainer | null, question: PollQuestion): void
    {
        this.populateSelectionType(container, question, 'poll_answer_checkbox_input');
    }

    // AS3: .../widget/poll/PollContentDialog.as::populateRadionButtonType() / ::populateCheckBoxType()
    // The two are identical but for the layout name, so they are folded. AS3 *throws* when the
    // asset is missing; this port warns and renders nothing, because a missing layout is a build
    // problem and throwing would take the room UI down with it.
    private populateSelectionType(container: IWindowContainer | null, question: PollQuestion, layout: string): void
    {
        if(container === null) return;

        const list = this._widget?.windowManager.buildWidgetLayout(layout) as IWindowContainer | null;

        if(list === null || list === undefined)
        {
            log.warn(`Asset for poll widget not found: "${layout}"`);

            return;
        }

        this.populateSelectionList(question, list);
        container.addChild(list);
    }

    /**
     * The layout ships with one row; the list is grown to `length` by cloning it `length - 1`
     * times, then every row is filled. The row's selectable child gets its index as `id`, which
     * is how the radio answer maps a selection back to a choice.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::populateSelectionList()
    private populateSelectionList(question: PollQuestion, list: IWindowContainer): void
    {
        const itemList = list.findChildByName('poll_answer_itemlist') as IItemListWindow | null;

        if(itemList === null || itemList === undefined) return;

        const template = list.findChildByName('poll_answer_entity') as IWindowContainer | null;

        if(template === null || template === undefined) return;

        const choices = question.questionChoices;

        for(let i = 0; i < choices.length - 1; i++)
        {
            itemList.addListItem(template.clone());
        }

        for(let i = 0; i < choices.length; i++)
        {
            const row = itemList.getListItemAt(i) as IWindowContainer | null;

            if(row === null || row === undefined) continue;

            const text = row.findChildByName('poll_answer_entity_text') as ITextWindow | null;

            if(text !== null && text !== undefined) text.text = choices[i]?.choiceText ?? '';

            const selectable = row.findChildByTag('POLL_SELECTABLE_ITEM');

            if(selectable !== null && selectable !== undefined) selectable.id = i;
        }
    }

    // AS3: .../widget/poll/PollContentDialog.as::populateTextLineType()
    private populateTextLineType(container: IWindowContainer | null): void
    {
        if(container === null) return;

        const input = this._widget?.windowManager.buildWidgetLayout('poll_answer_text_input') ?? null;

        if(input === null)
        {
            log.warn('Asset for poll widget not found: "poll_answer_text_input"');

            return;
        }

        container.addChild(input);
    }

    // AS3: .../widget/poll/PollContentDialog.as::populateTextAreaType()
    // Delegates, in AS3 too — the two types share one layout.
    private populateTextAreaType(container: IWindowContainer | null): void
    {
        this.populateTextLineType(container);
    }

    /**
     * The selector's chosen row carries the choice index as its `id`. Picking it is also what
     * arms the NPS follow-up: the chosen choice's `choiceType` becomes `_pendingChoiceType` —
     * but only in an NPS poll, where a plain poll resets it to 0.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::resolveRadionButtonTypeAnswer()
    // "Radion" [sic] — the AS3 spelling, not carried into the port's method name.
    private resolveRadioButtonTypeAnswer(question: PollQuestion): string[]
    {
        const answers: string[] = [];

        if(this._window === null) return answers;

        const selector = this._window.findChildByName('poll_answer_selector') as ISelectorWindow | null;

        if(selector === null || selector === undefined) return answers;

        const selected = selector.getSelected() as ISelectableWindow | null;

        if(selected === null || selected === undefined) return answers;

        const choice = question.questionChoices[selected.id];

        if(choice === undefined) return answers;

        this._pendingChoiceType = this._npsPoll ? choice.choiceType : 0;

        answers.push(choice.value);

        return answers;
    }

    // AS3: .../widget/poll/PollContentDialog.as::resolveCheckBoxTypeAnswer()
    // Walks the rendered rows rather than the choices, and reads the *state flag* rather than
    // `isSelected` — the checkbox is inside a cloned list item, so the flag is the reliable read.
    private resolveCheckBoxTypeAnswer(question: PollQuestion): string[]
    {
        const answers: string[] = [];

        if(this._window === null) return answers;

        const itemList = this._window.findChildByName('poll_answer_itemlist') as IItemListWindow | null;

        if(itemList === null || itemList === undefined) return answers;

        for(let i = 0; i < itemList.numListItems; i++)
        {
            const row = itemList.getListItemAt(i) as IWindowContainer | null;

            if(row === null || row === undefined) continue;

            const checkbox = row.findChildByName('poll_answer_checkbox');

            if(checkbox === null || checkbox === undefined) continue;

            if(checkbox.testStateFlag(PollContentDialog.STATE_FLAG_SELECTED))
            {
                const choice = question.questionChoices[i];

                if(choice !== undefined) answers.push(choice.value);
            }
        }

        return answers;
    }

    // AS3: .../widget/poll/PollContentDialog.as::resolveTextLineTypeAnswer()
    // AS3 throws "Invalid or disposed poll dialog!" when the window is gone; here it returns
    // empty, because the caller is a click handler and a thrown error there kills the room UI.
    private resolveTextLineTypeAnswer(): string[]
    {
        const answers: string[] = [];

        if(this._window === null) return answers;

        const input = this._window.findChildByName('poll_answer_input') as ITextWindow | null;

        if(input !== null && input !== undefined) answers.push(input.text);

        return answers;
    }

    // AS3: .../widget/poll/PollContentDialog.as::resolveTextAreaTypeAnswer()
    private resolveTextAreaTypeAnswer(): string[]
    {
        return this.resolveTextLineTypeAnswer();
    }

    // AS3: .../widget/poll/PollContentDialog.as::cancelPoll()
    private cancelPoll(): void
    {
        this._widget?.pollCancelled(this._id);
    }

    /**
     * Which question is being answered differs by poll kind: an NPS poll answers the question it
     * is *showing* (which may be a child), a plain one indexes the top-level array. Clearing
     * `_pendingChoiceType` before resolving is what makes a non-radio answer end the branch.
     *
     * Two of AS3's guards are kept although both are dead: `answerArray.length < 0` can never
     * hold, and a checkbox answer cannot exceed the choice count it was built from. They are
     * kept because removing them would be an invented correction, and both are cheap.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::answerPollQuestion()
    private answerPollQuestion(): void
    {
        const question = (this._npsPoll && this._currentQuestion !== null)
            ? this._currentQuestion
            : (this._questions?.[this._questionIndex] ?? null);

        if(question === null) return;

        this._pendingChoiceType = 0;

        let answerArray: string[];

        switch(question.questionType)
        {
            case PollQuestion.QUESTION_TYPE_RADIO:
                answerArray = this.resolveRadioButtonTypeAnswer(question);
                break;

            case PollQuestion.QUESTION_TYPE_CHECKBOX:
                answerArray = this.resolveCheckBoxTypeAnswer(question);

                if(answerArray.length < 0)
                {
                    this.alert('${poll_alert_answer_missing}');

                    return;
                }

                if(answerArray.length > question.questionChoices.length)
                {
                    this.alert('${poll_alert_invalid_selection}');

                    return;
                }

                break;

            case PollQuestion.QUESTION_TYPE_TEXT:
                answerArray = this.resolveTextLineTypeAnswer();
                break;

            case PollQuestion.QUESTION_TYPE_TEXT + 1:
                answerArray = this.resolveTextAreaTypeAnswer();
                break;

            default:
                log.warn(`Unknown poll question type: ${question.questionType}`);

                return;
        }

        const message = new RoomWidgetPollMessage(RoomWidgetPollMessage.ANSWER, this._id);

        message.questionId = question.questionId;

        // AS3's two branches differ only in nesting: with choices it spreads the answers, without
        // it pushes the whole array as a single element. The second shape is what a free-text
        // answer sends, and the composer flattens it either way.
        message.answers = question.questionChoices.length > 0 ? [...answerArray] : [answerArray.join('')];

        this._widget?.messageListener?.processWidgetMessage(message);

        this.nextQuestion();
    }

    // AS3: .../widget/poll/PollContentDialog.as::answerPollQuestion()
    // The two inline alerts, folded — both are the same self-disposing error box.
    private alert(message: string): void
    {
        this._widget?.windowManager.alert('${win_error}', message, 0, (dialog) => dialog.dispose());
    }

    /**
     * Built on layer 2 so it sits above the question window, and only once — a second close
     * click while the confirmation is up does nothing, because the guard is on the field.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::showCancelConfirm()
    private showCancelConfirm(): void
    {
        if(this._cancelConfirmWindow !== null) return;

        this._cancelConfirmWindow = this._widget?.windowManager
            .buildWidgetLayout('poll_cancel_confirm', 2) as IWindowContainer | null;

        if(this._cancelConfirmWindow === null || this._cancelConfirmWindow === undefined)
        {
            log.warn('poll_cancel_confirm did not build — the survey cannot be cancelled');
            this._cancelConfirmWindow = null;

            return;
        }

        this._cancelConfirmWindow.center();

        this.bind(this._cancelConfirmWindow, 'header_button_close', this.onCancelPollClose);
        this.bind(this._cancelConfirmWindow, 'poll_cancel_confirm_button_ok', this.onCancelPollOk);
        this.bind(this._cancelConfirmWindow, 'poll_cancel_confirm_button_cancel', this.onCancelPollCancel);
    }

    // AS3: .../widget/poll/PollContentDialog.as::hideCancelConfirm()
    private hideCancelConfirm(): void
    {
        if(this._cancelConfirmWindow !== null)
        {
            this._cancelConfirmWindow.dispose();
            this._cancelConfirmWindow = null;
        }
    }

    // AS3: .../widget/poll/PollContentDialog.as::onCancelPollClose()
    private onCancelPollClose = (): void =>
    {
        this.hideCancelConfirm();
    };

    // AS3: .../widget/poll/PollContentDialog.as::onCancelPollOk()
    // The only one of the three that actually abandons the poll.
    private onCancelPollOk = (): void =>
    {
        this.hideCancelConfirm();
        this.cancelPoll();
    };

    // AS3: .../widget/poll/PollContentDialog.as::onCancelPollCancel()
    private onCancelPollCancel = (): void =>
    {
        this.hideCancelConfirm();
    };

    /**
     * Not a count of answerable questions: it is the top-level count plus one for every parent
     * that has *any* children, however many. In an NPS poll at most one child per parent is ever
     * served, so this happens to be right; the name is AS3's.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/poll/PollContentDialog.as::answerableQuestionCount()
    private answerableQuestionCount(): void
    {
        const questions = this._questions ?? [];

        this._answerableQuestionCount = questions.length;

        for(const question of questions)
        {
            if((question?.children?.length ?? 0) > 0)
            {
                this._answerableQuestionCount = this._answerableQuestionCount + 1;
            }
        }
    }
}

const COSTS_SHEET = "Costs";

const DATE_COLUMN = "Date";
const DESCRIPTION_COLUMN = "Description";
const AMOUNT_COLUMN = "Amount";
const PAID_BY_COLUMN = "Paid By";
const PAID_FOR_COLUMN = "Paid For";
const SPLIT_COLUMN = "Split";

const BALANCES_SHEET = "Balances";

const PERSON_COLUMN = "Person";
const OWED_COLUMN = "Owed";

const TEMPLATE_ID = "1k8oeNvRP1kqNGrHdEjhIwC8YdGBlh2KpejukPiKJ8n8";
/* Template contains some complex formulas, written neatly here for completeness:
C2=IFNOTBLANK(
    $A2,
    SUM(
        MAP(
            _COSTS("Paid For"),
            _COSTS("Split"),
            _COSTS("Amount"),
            LAMBDA(
                paid_for, split_text, amount,
                _CALCULATE_SPLIT($A2, paid_for, split_text) * amount
            )
        )
    )
)

_CALCULATE_SPLIT(person, paid_for, split_text)=LAMBDA(
    people,
    LAMBDA(
        person_index, people_count,
        _FIRST_NON_NA(
            _SPLIT_ZERO_IF_NOT_FOUND(
                person_index
            ),
            _SPLIT_EVEN_IF_BLANK(
                people_count,
                split_text
            ),
            _SPLIT_BY_PERCENT(
                person_index,
                people_count,
                split_text
            ),
            _SPLIT_BY_RATIO(
                person_index,
                people_count,
                split_text
            )
        )
    )(MATCH(person,people,0), COUNTA(people))
)(SPLIT(paid_for,","))

_FIRST_NON_NA(value1,value2,value3,value4)=IFNA(
    value1,
    IFNA(
        value2,
        IFNA(
            value3,
            value4
        )
    )
)

_SPLIT_ZERO_IF_NOT_FOUND(split_index)=IF(
    ISERROR(split_index),
    0,
    NA()
)

_SPLIT_EVEN_IF_BLANK(split_count, split_text)=IF(
    split_text="",
    1/split_count,
    NA()
)

_SPLIT_BY_PERCENT(split_index, split_count, split_text)=LAMBDA(
    splits,
    IF(
        AND(
            split_count=COUNTA(splits),
            SUM(splits)=100
        ),
        INDEX(splits,0,split_index)/100,
        NA()
    )
)(SPLIT(split_text,"/"))

_SPLIT_BY_RATIO(split_index, split_count, split_text)=LAMBDA(
    splits,
    IF(
        AND(
            split_count=COUNTA(splits),
            SUM(splits)>0
        ),
        INDEX(splits,0,split_index)/SUM(splits),
        NA()
    )
)(SPLIT(split_text,":"))

_COSTS(column_header)=LAMBDA(
    column_index,
    INDIRECT("Costs!R2C" & column_index & ":C" & column_index, false)
)(MATCH(column_header, INDIRECT("Costs!A1:1"), 0))
*/
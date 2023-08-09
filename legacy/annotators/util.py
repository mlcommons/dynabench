# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

MTURK_LOCALE_REQUIREMENT = "00000000000000000071"
MTURK_NUMHITSAPPROVED_REQUIREMENT = "00000000000000000040"
Worker_PercentAssignmentsApproved = "000000000000000000L0"

MTURK_QUALIFICATIONS = {
    "100_hits_approved": {
        "QualificationTypeId": MTURK_NUMHITSAPPROVED_REQUIREMENT,
        "Comparator": "GreaterThanOrEqualTo",
        "IntegerValues": [100],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "800_hits_approved": {
        "QualificationTypeId": MTURK_NUMHITSAPPROVED_REQUIREMENT,
        "Comparator": "GreaterThanOrEqualTo",
        "IntegerValues": [800],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "1000_hits_approved": {
        "QualificationTypeId": MTURK_NUMHITSAPPROVED_REQUIREMENT,
        "Comparator": "GreaterThanOrEqualTo",
        "IntegerValues": [1000],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "97_percent_approved": {
        "QualificationTypeId": Worker_PercentAssignmentsApproved,
        "Comparator": "GreaterThanOrEqualTo",
        "IntegerValues": [97],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "98_percent_approved": {
        "QualificationTypeId": Worker_PercentAssignmentsApproved,
        "Comparator": "GreaterThanOrEqualTo",
        "IntegerValues": [98],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "english_only": {
        "QualificationTypeId": MTURK_LOCALE_REQUIREMENT,
        "Comparator": "In",
        "LocaleValues": [
            {"Country": "US"},
            {"Country": "CA"},
            {"Country": "GB"},
            {"Country": "AU"},
            {"Country": "NZ"},
        ],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "us_only": {
        "QualificationTypeId": MTURK_LOCALE_REQUIREMENT,
        "Comparator": "In",
        "LocaleValues": [{"Country": "US"}],
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    },
    "not_ca": {
        "QualificationTypeId": MTURK_LOCALE_REQUIREMENT,
        "Comparator": "NotEqualTo",
        "LocaleValues": [{"Country": "US", "Subdivision": "CA"}],
    }
    # NOTE: Feel free to add more qualifications here
}


def get_qualifications(quals):
    for q in quals:
        assert q in MTURK_QUALIFICATIONS
    return [MTURK_QUALIFICATIONS[q] for q in quals]


def arg_handler(parser):
    parser.add_argument(
        "-uo",
        "--use-onboarding",
        default=False,
        help="Launch task with onboarding requirement",
        action="store_true",
    )
    parser.add_argument(
        "-t", "--task", required=True, help="Task configuration file", type=str
    )
    parser.add_argument(
        "-n", "--num-jobs", required=True, help="Number of jobs", type=int
    )
    parser.add_argument(
        "--port", default=3001, help="Port to launch interface on", type=int
    )
    return parser.parse_launch_arguments()

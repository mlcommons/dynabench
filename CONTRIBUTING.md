# Contributing to dynabench
We want to make contributing to this project as easy and transparent as
possible.

## Pull Requests
We actively welcome your pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. If you haven't already, complete the Contributor License Agreement ("CLA").

## Coding Style

* In your editor, install the [editorconfig](https://editorconfig.org/) extension which should ensure that you are following the same standards as us.
* Dynabench uses pre-commit hooks to ensure style consistency and prevent common mistakes. Enable it by:

```sh
pip install pre-commit && pre-commit install
```

After this pre-commit hooks will be run before every commit.

* Read the [editorconfig](https://github.com/mlcommons/dynabench/blob/main/.editorconfig) file to understand the exact coding style preferences.

* Ideally, black and isort should be run via pre-commit hooks.
But if for some reason you want to run black and isort separately follow this:

``` bash

pip install black==22.3.0 isort==4.3.21
black ./(mmf|tests|tools)/**/*.py
isort -rc (mmf|tests|tools)

```

Before commit your changes to your branch run the pre-commit hooks and make sure your code pass all the tests. If your code fail a test, fix it and then commit.

__Note:__ If any linter doesn't pass, your pull request is not going to be accepted.

## Migrations

We are using [yoyo-migrations](https://ollycope.com/software/yoyo/latest/) tool to do our schema migrations in a systematic manner.
By default, yoyo should run any pending migrations automatically to your database.

To add or update the database schema, you will have to create a new migration following these steps:

* `cd api`
* Call `yoyo new ./migrations -m "Message describing your schema change"`
* This will open up an editor with all of the previous dependency migrations already added.
In the `step` call inside the template, you will add two queries, first argument is the query
you actually want to perform and second is the query to rollback your change.
* Add your migration queries, save the file and exit the editor.
* yoyo should create a new migration script for your queries.
* Commit these, create a PR and next time anybody launches there server after the pull, migrations
should get applied automatically.

An example of adding `api_token` field to table `users` looks like following:

```py
"""
Add api_token to users
"""

from yoyo import step

__depends__ = {}

steps = [
    step(
        "ALTER TABLE users ADD COLUMN api_token VARCHAR(255)",
        "ALTER TABLE users DROP COLUMN api_token",
    )
]
```

You can read more on yoyo in its [documentation](https://ollycope.com/software/yoyo/latest/).

> NOTE: Don't do manual CUD queries to database anymore, this can leave yoyo in a weird state

## Contributor License Agreement ("CLA")
In order to accept your pull request, we need you to submit a CLA. You only need
to do this once to work on any of Facebook's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

## Issues
We use GitHub issues to track public bugs. Please ensure your description is
clear and has sufficient instructions to be able to reproduce the issue.

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe
disclosure of security bugs. In those cases, please go through the process
outlined on that page and do not file a public issue.

## License
By contributing to dynabench, you agree that your contributions will be licensed
under the LICENSE file in the root directory of this source tree.

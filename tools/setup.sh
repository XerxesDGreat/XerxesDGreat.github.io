#!/usr/bin/env bash

help() {
  echo "Initializes the repo for full usability. Includes:"
  echo "  - creating python virtualenv using .ve"
  echo "  - installing pre-commit (https://pre-commit.com/)"
  echo "  - installing jekyll"
  echo
  echo "Usage:"
  echo
  echo "   bash $0 [options]"
  echo
  echo "Options:"
  echo "     -h, --help               Print this information."
}

main() {
  echo "== Creating and initializing virtualenv =="
  if ! test -d .ve ; then
    virtualenv -p python3 .ve
    . .ve/bin/activate
    pip install -f requirements.txt
  else
    echo "already exists"
  fi
  echo "== done =="
  echo 
  echo 

  echo "== Initializing pre-commit =="
  pre-commit install
  echo "== done =="
  echo
  echo

  echo "== Installing and initializing Jekyll =="
  gem install bundler jekyll
  bundle install
  echo "== done =="
  echo
  echo
  
  echo "== Test the site =="
  script_full_path=$(dirname "$0")
  ${script_full_path}/test.sh
}

install_if_missing_hb() {
  echo "== Checking $1 =="
  local pkg="$1"
  if ! brew ls --versions "$pkg" > /dev/null; then
    echo "  Missing; installing $pkg..."
    brew install "$pkg"
  else
    echo "  $pkg already installed"
  fi
}

while (($#)); do
  opt="$1"
  case $opt in
  -h | --help)
    help
    exit 0
    ;;
  *)
    # unknown option
    help
    exit 1
    ;;
  esac
done

main
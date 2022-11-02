/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package functions;

// [START functions_helloworld_http]

import ataxpackage.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.concurrent.atomic.AtomicInteger;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Map;
import java.util.Scanner;
import java.util.*;

@SpringBootApplication
public class RunAtax {
  private final AtomicInteger count = new AtomicInteger(0);
  @Value("${NAME:World}")
  String name;

  @RestController
  class AtaxController {
    @GetMapping("/")
    String execute() throws InterruptedException {
      
      Atax atax = new Atax();
      String res = atax.runAtax("M", 1);
      // res += "\n";
      System.out.println(res);
      return res;
    }
  }


  public static void main(String[] args) {
    SpringApplication.run(RunAtax.class, args);
  }
}
// [END functions_helloworld_http]

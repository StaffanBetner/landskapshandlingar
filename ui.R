if (!("pacman" %in% rownames(installed.packages()))) {install.packages("pacman")}
pacman::p_load(shiny, DT, shinydashboard)

sidebar <- dashboardSidebar(
  sidebarMenu(
    menuItem("Register", tabName = "register"),
    menuItem("Om-sida", tabName = "about")))
body <- dashboardBody(
  tabItems(
    tabItem(tabName = "register", DTOutput("table")),
    tabItem(tabName = "about", 
            "Detta register har satts samman av Staffan Betnér genom att koppla ihop information från Nationella ArkivDatabas (NAD) med det register över landskapshandlingar som Riksarkivet tidigare tillgängliggjort på sin hemsida under CC0-licens. 
            Helt saknade handlingar är bortplockade från detta register. Mitt register kan laddas ner i Excelformat", a("härifrån.", href="https://drive.google.com/file/d/1SqcelFLCmrDJLUdYXyWL5wqbZchBRXxY/view?usp=sharing"), 
            br(), br(),
            "Vill man nå mig gör man det bäst på mail:", a("staffan@betner.nu", href="mailto:staffan@betner.nu"))
  )
)

dashboardPage(
  dashboardHeader(title = "Landskapshandlingar", titleWidth = 310),
  sidebar,
  body)